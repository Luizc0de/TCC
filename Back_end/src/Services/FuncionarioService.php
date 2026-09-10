<?php 

namespace App\Services;
use App\Models\Funcionario;
use App\Repository\FuncionarioRepository;
use App\Utils\Response;

class FuncionarioService
{
    public static function createFuncionario($fields)
    {
        try {
            $funcionario = new Funcionario(
                $fields['name'],
                $fields['email'],
                password_hash($fields['password'], PASSWORD_DEFAULT),
                $fields['setor'],
                $fields['cpf'],
                $fields['salario']
            );
            FuncionarioRepository::save($funcionario);//code...
        
        
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 500;
            Response::json(['error' => $e->getMessage()], $status);
        }
        
    }

    public static function changepassword($fields)
    {
        $funcionario = FuncionarioRepository::findByEmail($fields['email']);
        if (!$funcionario) {
            throw new \Exception('Funcionario not found');
        }
        if (!password_verify($fields['old_password'], $funcionario->getPassword())) {
            throw new \Exception('Old password does not match');
        }
        FuncionarioRepository::updatePassword(
            $funcionario->getId(),
            password_hash($fields['new_password'], PASSWORD_DEFAULT)
        );
    }

    public static function getProfile($id)
    {
        return FuncionarioRepository::findById($id);
    }
}

?>