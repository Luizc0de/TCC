<?php

namespace App\Core;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;

class JwtService
{
    private static string $secret = 'a1f9c8e2b7d4f6a0c3e5b8d1f2a4c6e9b3d7f0a2c5e8b1d4f7a0c3e6b9d2f5a8';

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
            self::$secret,
            'HS256'
        );
    }


    public static function validate(string $token): object
    {
        return JWT::decode(
            $token,
            new Key(self::$secret, 'HS256')
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
        http_response_code(401);

        echo json_encode([
            'error' => $message
        ]);

        exit;
    }
    public static function requireRole(string $role): object
    {
    $user = self::authenticate();

    if (
        !isset($user->roles) ||
        !in_array($role, $user->roles)
    ) {

        http_response_code(403);

        echo json_encode([
            'error' => 'Você não possui permissão para acessar este recurso'
        ]);

        exit;
    }

    return $user;
    }
}




