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
    // Cria usuario PF (Pessoa Física)
    public static function createUserPF($fields)
    {
        try {
            $code = authenticator::generateToken();

            $user = new UserPF(
                null,
                $fields['name'],
                $fields['email'],
                password_hash($fields['password'], PASSWORD_DEFAULT),
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
    // ver usuario 
    public static function getProfile($id)
    {
        try {
            $user = UserRepository::getUserById($id);

            if (!$user) {
                Response::json(['error' => 'User not found'], 404);
                return;
            }

            Response::json(['nome' => $user->getName(), 
                            'email' => $user->getEmail(),
                            'cpf' => $user->getCpf(),
                            ], 200);
                            
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 500;
            Response::json(['error' => $e->getMessage()], $status);
        }
    }

    public static function changePassword($userId, $fields)
    {
        try {
            $user = UserRepository::getUserById($userId);

            if (!$user) {
                Response::json(['error' => 'User not found'], 404);
                return;
            }

            if (!password_verify($fields['current_password'], $user->getPassword())) {
                Response::json(['error' => 'Current password is incorrect'], 400);
                return;
            }

            $newHashedPassword = password_hash($fields['new_password'], PASSWORD_DEFAULT);
            UserRepository::updatePassword($userId, $newHashedPassword);

            Response::json(['message' => 'Password changed successfully'], 200);
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 500;
            Response::json(['error' => $e->getMessage()], $status);
        }
    }
    

}