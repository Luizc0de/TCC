<?php

namespace App\Repository;

class SinistroRepository
{
    private const SELECT = 'SELECT s.idSinistro, s.idApolice, s.descricao,
        s.imagemArquivo, s.imagemMime, s.status, s.dataAbertura,
        a.numeroApolice, a.idCliente, a.idFuncionario, c.name AS cliente
        FROM sinistro s INNER JOIN apolice a ON a.idApolice = s.idApolice
        LEFT JOIN cliente c ON c.idCliente = a.idCliente';

    private static function consultar(int $idUsuario, string $perfil, ?int $idApolice, ?int $idSinistro): \PDOStatement
    {
        $colunaVinculo = match ($perfil) {
            'cliente' => 'a.idCliente', 'funcionario' => 'a.idFuncionario', 'atendimento' => null,
            default => throw new \DomainException('Perfil sem permissão para acessar sinistros.', 403),
        };
        $filtros = [];
        $params = [];
        if ($colunaVinculo !== null) {
            $filtros[] = $colunaVinculo . ' = ?';
            $params[] = $idUsuario;
        }
        if ($idApolice !== null) {
            $filtros[] = 's.idApolice = ?';
            $params[] = $idApolice;
        }
        if ($idSinistro !== null) {
            $filtros[] = 's.idSinistro = ?';
            $params[] = $idSinistro;
        }
        $sql = self::SELECT . ($filtros ? ' WHERE ' . implode(' AND ', $filtros) : '');
        if ($idSinistro === null) {
            $sql .= $perfil === 'atendimento' ? " ORDER BY (s.status = 'ABERTO') DESC, " : ' ORDER BY ';
            $sql .= 's.dataAbertura DESC, s.idSinistro DESC';
        }
        $stmt = ApoliceRepository::getConnection()->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }

    public static function getAll(int $idUsuario, string $perfil, ?int $idApolice = null): array
    {
        return self::consultar($idUsuario, $perfil, $idApolice, null)->fetchAll(\PDO::FETCH_ASSOC);
    }

    public static function getById(int $idSinistro, int $idUsuario, string $perfil): ?array
    {
        return self::consultar($idUsuario, $perfil, null, $idSinistro)->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public static function decidir(int $idSinistro, string $status): void
    {
        $db = ApoliceRepository::getConnection();
        $stmt = $db->prepare("UPDATE sinistro SET status = ? WHERE idSinistro = ? AND status = 'ABERTO'");
        $stmt->execute([$status, $idSinistro]);
        if ($stmt->rowCount() === 1) {
            return;
        }
        $consulta = $db->prepare('SELECT status FROM sinistro WHERE idSinistro = ?');
        $consulta->execute([$idSinistro]);
        $atual = $consulta->fetchColumn();
        if ($atual === false) {
            throw new \DomainException('Sinistro não encontrado.', 404);
        }
        if ($atual !== $status) {
            throw new \DomainException('Este sinistro já recebeu outra decisão.', 409);
        }
    }

    public static function getApoliceDoCliente(int $idApolice, int $idCliente): ?array
    {
        // A abertura mantém a apólice bloqueada até salvar a imagem e o registro.
        $stmt = ApoliceRepository::getConnection()->prepare(
            'SELECT idApolice FROM apolice WHERE idApolice = :idApolice AND idCliente = :idCliente FOR UPDATE'
        );
        $stmt->execute([':idApolice' => $idApolice, ':idCliente' => $idCliente]);

        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public static function save(int $idApolice, string $descricao, array $imagem): int
    {
        $db = ApoliceRepository::getConnection();
        $stmt = $db->prepare(
            "INSERT INTO sinistro (idApolice, descricao, imagemArquivo, imagemMime, status)
            VALUES (:idApolice, :descricao, :arquivo, :mime, 'ABERTO')"
        );
        $stmt->execute([
            ':idApolice' => $idApolice,
            ':descricao' => $descricao,
            ':arquivo' => $imagem['arquivo'],
            ':mime' => $imagem['mime'],
        ]);

        return (int) $db->lastInsertId();
    }
}
