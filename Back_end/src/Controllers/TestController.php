<?php

namespace App\Controllers;

use App\Core\JwtService;
use App\Utils\Response;

class TestController
{
    // Rota pública — não deve exigir token
    public function publicRoute()
    {
        Response::json([
            'message' => 'Rota pública acessada com sucesso.'
        ], 200);
    }

    // Rota privada — exige token válido, sem role específica
    public function privateRoute()
    {
        $user = JwtService::authenticate();

        Response::json([
            'message' => 'Rota privada acessada com sucesso.',
            'user' => $user
        ], 200);
    }

    // Rota privada com role — exige token válido + role "admin"
    public function adminRoute()
    {
        $user = JwtService::requireRole('admin');

        Response::json([
            'message' => 'Rota de admin acessada com sucesso.',
            'user' => $user
        ], 200);
    }
}
?>