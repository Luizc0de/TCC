<?php 
namespace App\Controllers;

use App\Services\AuthServices;
use App\Utils\Request;
use App\Utils\Response;
use App\Core\JwtService;
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

        $user = AuthServices::login($fields['email'], $fields['password']);

        if (!$user) {
            Response::json(['message' => 'Invalid email or password.'], 400);
            return;
        }

        $roles = is_array($user->roles) ? $user->roles : [$user->roles];
        $token = JwtService::generate($user->getEmail(), $user->getId(), $roles);

        Response::json(['message' => 'Login successful.', 'token' => $token], 200);
    }
    
    public function verifyCode()
    {
        $body = Request::getBody();
        
        try {
            $fields = Request::validate([
                'code' => $body['code']   ?? '',
                'email' => $body['email'] ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        
        return AuthServices::verifyCode($fields['code'], $fields['email']);
    }
}