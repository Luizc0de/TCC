<?php 
namespace App\Controllers;

use App\Services\FuncionarioService;
use App\Services\UserServices;
use App\Utils\Request;
use App\Utils\Response;

class FuncionarioController
{
    public function createFuncionario()
    {
        $body = Request::getBody();
        
        try {
            $fields = Request::validate([
                'name' => $body['name']         ?? '',
                'email' => $body['email']       ?? '',
                'password' => $body['password'] ?? '',
                'setor' => $body['setor']       ?? '',  
                'cpf' => $body['cpf']           ?? '',
                'salario' => $body['salario']   ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        FuncionarioService::createFuncionario($fields);
    }

    public function getFuncionario(Request $request){
        $user = $request->user();

        UserServices::getProfile($user->sub);
    }

    public function changepassword()
    {
        $body = Request::getBody();

        try {
            $fields = Request::validate([
                'email' => $body['email']       ?? '',
                'old_password' => $body['old_password'] ?? '',
                'new_password' => $body['new_password'] ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        FuncionarioService::changepassword($fields);
    }

}


?>