<?php

namespace App\Controllers;  

use App\Services\UserServices;
use App\Services\AuthServices;
use App\Utils\Request;
use App\Utils\Response;

class UserController
{
    
    public function createUserPF(){
        $body = Request::getBody();
        
        try {
            $fields = Request::validate([
                'name' => $body['name']         ?? '',
                'email' => $body['email']       ?? '',
                'password' => $body['password'] ?? '',
                'cpf' => $body['cpf']           ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        UserServices::createUserPF($fields);
    }

    public function getUserPF(Request $request){
        $user = $request->user();

        UserServices::getProfile($user->sub);
    }
}
?>