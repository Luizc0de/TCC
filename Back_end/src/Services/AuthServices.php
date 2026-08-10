<?php 

namespace App\Services;

use App\Utils\Response;
use App\Repository\UserRepository;

class AuthServices
{
    public static function verifyCode($code, $email)
    {
        // Buscar o código salvo no banco de dados
        $savedCode = UserRepository::getcodebyemail($email);
        
        if ($code === $savedCode) {
            UserRepository::changeValidationStatus($email, 1); // Atualiza o status de validação para 1 (validado)
            return Response::json(["message" => "Código verificado com sucesso."], 200);
        }

        return Response::json(["message" => "Código inválido."], 400);
    }
    
    
}



?>