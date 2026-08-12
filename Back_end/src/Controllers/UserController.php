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

    public function createUserPJ(){
        $body = Request::getBody();
        
        try {
            $fields = Request::validate([
                'company_name' => $body['company_name'] ?? '',
                'email' => $body['email']             ?? '',
                'password' => $body['password']       ?? '',
                'cnpj' => $body['cnpj']               ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
       
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
?>