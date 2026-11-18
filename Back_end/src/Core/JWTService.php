<?php

namespace App\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;
use App\Utils\Response;

class JwtService
{
    private static function secret(): string
    {
        $secret = $_ENV['JWT_SECRET'] ?? '';
        if (strlen($secret) < 32) {
            throw new \RuntimeException('Configure JWT_SECRET com pelo menos 32 bytes.');
        }
        return $secret;
    }

    public static function generate(string $email, int $userId, array $roles): string {

        $now = time();

        $payload = [
            'sub' => $userId,

            'email' => $email,
            
            'roles' => $roles,

            'iat' => $now,

            'exp' => $now + 3600
        ];

        return JWT::encode(
            $payload,
            self::secret(),
            'HS256'
        );
    }


    public static function validate(string $token): object
    {
        return JWT::decode(
            $token,
            new Key(self::secret(), 'HS256')
        );
    }

    public static function authenticate(): object
    {
        $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!$authorization) {
            self::unauthorized('Token não informado');
        }

        if (!preg_match('/Bearer\s+(.+)/', $authorization, $matches)) {
            self::unauthorized('Formato do token inválido');
        }

        $token = $matches[1];

        try {

            return JwtService::validate($token);

        } catch (Exception $e) {

            self::unauthorized('Token inválido ou expirado');
        }
    }


    private static function unauthorized(string $message): never
    {
        Response::json(['error' => $message], 401);

        exit;
    }
    public static function requireRole(string|array $roles): object
    {
        $user = self::authenticate();
        if (!self::hasRoles($user, $roles)) {
            Response::json(['error' => 'Você não possui permissão para acessar este recurso'], 403);
            exit;
        }

        return $user;
    }

    public static function hasRoles(object $user, string|array $roles): bool
    {
        $required = (array) $roles;
        if (!$required || !is_array($user->roles ?? null)) {
            return false;
        }
        foreach ($required as $role) {
            if (!in_array($role, $user->roles, true)) {
                return false;
            }
        }
        return true;
    }
}




