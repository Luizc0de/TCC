<?php 

namespace App\Models;

class UserPF {
    private $id;
    private $name;
    private $email;
    private $password;
    private $cpf;
    private $code;
    
    public function __construct($id, $name, $email, $password, $cpf, $code = null) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->cpf = $cpf;
        $this->code = $code;
    }

    public function getId() {
        return $this->id;
    }

    public function getName() {
        return $this->name;
    }

    public function getEmail() {
        return $this->email;
    }

    public function getPassword() {
        return $this->password;
    }

    public function getCpf() {
        return $this->cpf;
    }

    public function getCode() {
        return $this->code;
    }
}