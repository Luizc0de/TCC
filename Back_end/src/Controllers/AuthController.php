<?php 
namespace App\Controllers;

use App\Services\AuthServices;
use App\Utils\Request;
use App\Utils\Response;
class AuthController
{
    public function login()
    {
        $body = Request::getBody();
        
        try {
            $fields = Request::validate([
                'email' => $body['email']     ?? '',
                'password' => $body['password'] ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }

        AuthServices::login($fields['email'], $fields['password']);
    }
}


?>