<?php

namespace App\Services;

use App\Repository\RecuperacaoSenhaRepository;
use App\Utils\Email;

class RecuperacaoSenhaService
{
    private static function conta(array $dados): ?array
    {
        $email = is_string($dados['email'] ?? null) ? trim($dados['email']) : '';
        if (strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \DomainException('Informe um e-mail válido.', 400);
        }
        if (!in_array($dados['tipoConta'] ?? null, ['cliente', 'funcionario'], true)) {
            throw new \DomainException('Selecione o tipo de conta.', 400);
        }
        return RecuperacaoSenhaRepository::conta($dados['tipoConta'], $email);
    }

    private static function hashCodigo(string $codigo, string $tipo, array $conta): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? '';
        if (strlen($secret) < 32) throw new \RuntimeException('Configuração de recuperação indisponível.');
        return hash_hmac('sha256', "recuperacao|$tipo|{$conta['id']}|{$conta['email']}|$codigo", $secret);
    }

    public static function solicitar(array $dados): array
    {
        $conta = self::conta($dados);
        if ($conta !== null) {
            $tipo = $dados['tipoConta'];
            $codigo = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $hash = self::hashCodigo($codigo, $tipo, $conta);
            if (RecuperacaoSenhaRepository::reservarCodigo($tipo, $conta, $hash)) {
                try {
                    Email::sendPasswordResetCode($conta['email'], $codigo, RecuperacaoSenhaRepository::VALIDADE_MINUTOS);
                } catch (\PHPMailer\PHPMailer\Exception $e) {
                    RecuperacaoSenhaRepository::cancelarEnvio($tipo, (int) $conta['id'], $hash);
                    error_log('Falha no envio SMTP do código de recuperação.');
                    throw new \DomainException('O envio de e-mail está indisponível. Tente novamente mais tarde.', 503);
                }
            }
        }
        return ['message' => 'Se o e-mail estiver cadastrado nesse tipo de conta, você receberá um código de seis dígitos.'];
    }

    public static function verificar(array $dados): array
    {
        $codigo = $dados['codigo'] ?? null;
        if (!is_string($codigo) || !preg_match('/\A[0-9]{6}\z/', $codigo)) {
            throw new \DomainException('Informe os seis dígitos do código.', 400);
        }
        $conta = self::conta($dados);
        $tipo = $dados['tipoConta'];
        $token = $conta === null ? null : RecuperacaoSenhaRepository::validarCodigo($tipo, $conta, self::hashCodigo($codigo, $tipo, $conta));
        if ($token === null) {
            throw new \DomainException('Código inválido ou expirado. Após cinco tentativas, aguarde 15 minutos para solicitar outro.', 400);
        }
        return ['token' => $token];
    }

    public static function redefinir(array $dados): array
    {
        $token = $dados['token'] ?? null;
        $senha = $dados['password'] ?? null;
        if (!is_string($token) || !preg_match('/\A[0-9a-f]{64}\z/', $token)) {
            throw new \DomainException('Valide o código novamente para alterar a senha.', 403);
        }
        if (!is_string($senha) || trim($senha) === '' || mb_strlen($senha, 'UTF-8') < 8 || strlen($senha) > 72 || str_contains($senha, "\0")) {
            throw new \DomainException('Use uma senha com pelo menos 8 caracteres e no máximo 72 bytes.', 400);
        }
        if (!RecuperacaoSenhaRepository::redefinir($token, $senha)) {
            throw new \DomainException('A autorização expirou. Solicite outro código.', 403);
        }
        return ['message' => 'Senha alterada. Entre com sua nova senha.'];
    }
}
