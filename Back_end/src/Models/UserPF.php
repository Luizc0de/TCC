<?php 

namespace App\Models;

class UserPF {
    private $id;
    private $name;
    private $email;
    private $password;
    private $cpf;
    
    public function __construct($id, $name, $email, $password, $cpf) {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->cpf = $cpf;
    }

    public function getname() {
        return $this->name;
    }
}