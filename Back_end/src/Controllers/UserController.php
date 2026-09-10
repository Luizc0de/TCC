<?php

namespace App\Controllers;  

use App\Services\UserServices;
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

    public function ChangePassword(Request $request){
        $user = $request->user();
        $body = Request::getBody();

        try {
            $fields = Request::validate([
                'current_password' => $body['current_password'] ?? '',
                'new_password' => $body['new_password'] ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }

        UserServices::changePassword($user->sub, $fields);
    }


}
?>