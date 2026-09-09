<?php 
namespace App\Controllers;
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
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        UserServices::createFuncionario($fields);
    }

    public function getFuncionario(Request $request){
        $user = $request->user();

        UserServices::getProfile($user->sub);
    }
}


?>