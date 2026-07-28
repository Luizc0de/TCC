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

    public function getname() {
        return $this->name;
    }

    public function getCode() {
        return $this->code;
    }
}