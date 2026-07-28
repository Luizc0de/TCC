<?php

namespace App\Services;

use App\Utils\Response;
use App\Models\UserPF;
use App\Models\UserPJ;
use App\Utils\Email;
use App\Core\authenticator;

class UserServices
{
    public static function createUserPF($fields)
    {
        $code = authenticator::generateToken();
        $user = new UserPF(
            null,
            $fields['name'],
            $fields['email'],
            $fields['password'],
            $fields['cpf'],
            $code
        );

        $result = Email::sendEmail(
            $fields['email'],
            'Cadastro realizado',
            'Olá, seu cadastro foi criado com sucesso. ' . "\n" . "Seu código de autenticação é: " . $code
        );

        Response::json($result, 201);
    }

    public static function createUserPJ($data)
    {
        $user = new UserPJ(
            null,
            $data['company_name'],
            $data['email'],
            $data['password'],
            $data['cnpj']
        );

        Response::json([
            'message' => 'User PJ created successfully',
            'data' => $user->getCompanyName()
        ], 201);
    }
}