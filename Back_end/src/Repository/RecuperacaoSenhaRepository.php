<?php

namespace App\Repository;

class RecuperacaoSenhaRepository
{
    private const IDS = ['cliente' => 'idCliente', 'funcionario' => 'idFuncionario'];
    public const VALIDADE_MINUTOS = 10;

    public static function conta(string $tipo, string $email): ?array
    {
        $id = self::IDS[$tipo] ?? throw new \DomainException('Selecione o tipo de conta.', 400);
        $stmt = ApoliceRepository::getConnection()->prepare("SELECT $id AS id, email FROM $tipo WHERE email = ?");
        $stmt->execute([$email]);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    private static function transacao(callable $acao)
    {
        $db = ApoliceRepository::getConnection();
        $db->beginTransaction();
        try {
            $resultado = $acao($db);
            $db->commit();
            return $resultado;
        } catch (\Throwable $e) {
            if ($db->inTransaction()) $db->rollBack();
            throw $e;
        }
    }

    public static function reservarCodigo(string $tipo, array $conta, string $hash): bool
    {
        return self::transacao(static function ($db) use ($tipo, $conta, $hash) {
            $chave = [$tipo, $conta['id']];
            $db->prepare('INSERT INTO recuperacao_senha (tipoConta,idConta,email) VALUES (?,?,?)
                ON DUPLICATE KEY UPDATE idConta = idConta')->execute([$tipo, $conta['id'], $conta['email']]);
            $stmt = $db->prepare('SELECT ultimoEnvio, inicioJanela, envios, tentativas FROM recuperacao_senha
                WHERE tipoConta = ? AND idConta = ? FOR UPDATE');
            $stmt->execute($chave);
            $linha = $stmt->fetch(\PDO::FETCH_ASSOC);
            $agora = time();
            $novaJanela = $agora >= (int) $linha['inicioJanela'] + 900;
            if ($agora < (int) $linha['ultimoEnvio'] + 60 ||
                (!$novaJanela && ($linha['envios'] >= 3 || $linha['tentativas'] >= 5))) {
                return false;
            }
            $db->prepare('UPDATE recuperacao_senha SET email = ?, codigoHash = ?, tokenHash = NULL,
                expiraEm = ?, ultimoEnvio = ?, inicioJanela = ?, envios = ?, tentativas = ?
                WHERE tipoConta = ? AND idConta = ?')->execute([
                    $conta['email'], $hash, $agora + self::VALIDADE_MINUTOS * 60, $agora,
                    $novaJanela ? $agora : $linha['inicioJanela'], $novaJanela ? 1 : $linha['envios'] + 1,
                    $novaJanela ? 0 : $linha['tentativas'], $tipo, $conta['id']
                ]);
            return true;
        });
    }

    public static function cancelarEnvio(string $tipo, int $id, string $hash): void
    {
        ApoliceRepository::getConnection()->prepare('UPDATE recuperacao_senha SET codigoHash = NULL, ultimoEnvio = 0
            WHERE tipoConta = ? AND idConta = ? AND codigoHash = ?')->execute([$tipo, $id, $hash]);
    }

    public static function validarCodigo(string $tipo, array $conta, string $hash): ?string
    {
        return self::transacao(static function ($db) use ($tipo, $conta, $hash) {
            $chave = [$tipo, $conta['id']];
            $stmt = $db->prepare('SELECT codigoHash, expiraEm, tentativas FROM recuperacao_senha
                WHERE tipoConta = ? AND idConta = ? AND BINARY email = ? FOR UPDATE');
            $stmt->execute([$tipo, $conta['id'], $conta['email']]);
            $linha = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$linha || $linha['codigoHash'] === null || $linha['expiraEm'] <= time() || $linha['tentativas'] >= 5) {
                return null;
            }
            if (!hash_equals($linha['codigoHash'], $hash)) {
                $db->prepare('UPDATE recuperacao_senha SET tentativas = tentativas + 1 WHERE tipoConta = ? AND idConta = ?')
                    ->execute($chave);
                return null;
            }
            $token = bin2hex(random_bytes(32));
            $db->prepare('UPDATE recuperacao_senha SET codigoHash = NULL, tokenHash = ?, expiraEm = ?
                WHERE tipoConta = ? AND idConta = ?')->execute([
                    hash('sha256', $token), time() + self::VALIDADE_MINUTOS * 60, $tipo, $conta['id']
                ]);
            return $token;
        });
    }

    public static function redefinir(string $token, string $senha): bool
    {
        return self::transacao(static function ($db) use ($token, $senha) {
            $hash = hash('sha256', $token);
            $stmt = $db->prepare('SELECT tipoConta, idConta, email, expiraEm FROM recuperacao_senha WHERE tokenHash = ? FOR UPDATE');
            $stmt->execute([$hash]);
            $linha = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$linha || $linha['expiraEm'] <= time()) return false;
            $tipo = $linha['tipoConta'];
            $id = self::IDS[$tipo];
            $update = $db->prepare("UPDATE $tipo SET password = ? WHERE $id = ? AND BINARY email = ?");
            $update->execute([password_hash($senha, PASSWORD_DEFAULT), $linha['idConta'], $linha['email']]);
            $db->prepare('DELETE FROM recuperacao_senha WHERE tokenHash = ?')->execute([$hash]);
            return $update->rowCount() === 1;
        });
    }
}
