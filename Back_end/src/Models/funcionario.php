<?php 

namespace App\Models;  

class Funcionario
{
    private int $id;
    private string $name;
    private string $email;
    private string $password;
    private string $setor;
    private string $cpf;
    private float $salario;
    public array $roles;

    public function __construct($name, $email, $password, $setor, $cpf, $salario)
    {
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->setor = $setor;
        $this->cpf = $cpf;
        $this->salario = $salario;  
    }

    public function getId()
    {
        return $this->id;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getPassword()
    {
        return $this->password;
    }

    public function getSetor()
    {
        return $this->setor;
    }

    public function getCpf()
    {
        return $this->cpf;
    }
}


?>