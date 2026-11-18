<?php

namespace App\Controllers;  

use App\Services\UserServices;
use App\Services\FuncionarioService;
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
        if (in_array('funcionario', (array) ($user->roles ?? []), true)) {
            $profile = FuncionarioService::getProfile($user->sub);
            if ($profile === null) {
                Response::json(['error' => 'Funcionário não encontrado.'], 404);
                return;
            }
            Response::json($profile + ['roles' => $user->roles], 200);
            return;
        }
        UserServices::getProfile($user->sub);
    }
    public function Index(){
        UserServices::index();
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
//

}
?>
