<?php

namespace App\Services;

use App\Utils\Response;
use App\Models\UserPF;
use App\Models\UserPJ;
use App\Utils\Email;
use App\Core\authenticator;
use App\Repository\UserRepository;

class UserServices
{
    public static function createUserPF($fields)
    {
        try {
            $code = authenticator::generateToken();

            $user = new UserPF(
                null,
                $fields['name'],
                $fields['email'],
                $fields['password'],
                $fields['cpf'],
                $code
            );

            UserRepository::createUserPF($user);

            $result = Email::sendEmail(
                $fields['email'],
                'Cadastro realizado',
                'Olá, seu cadastro foi criado com sucesso. ' . "\n" . "Seu código de autenticação é: " . $code
            );

            Response::json($result, 201);
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 500;
            Response::json(['error' => $e->getMessage()], $status);
        }
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