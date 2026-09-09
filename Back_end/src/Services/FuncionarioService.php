<?php 

namespace App\Services;
use App\Models\Funcionario;
use App\Repositories\FuncionarioRepository;

class FuncionarioService
{
    public static function createFuncionario($fields)
    {
        $funcionario = new Funcionario(
            $fields['name'],
            $fields['email'],
            $fields['password'],
            $fields['setor'],
            $fields['cpf'],
            $fields['salario']
        );
        
       FuncionarioRepository::save($funcionario);
    }

    public static function getProfile($id)
    {
        
        return FuncionarioRepository::findById($id);
    }
}

?>