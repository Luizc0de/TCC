<?php

namespace App\Models;

class UserPJ {
    private $id;
    private $company_name;
    private $email;
    private $password;
    private $cnpj;
    
    public function __construct($id, $company_name, $email, $password, $cnpj) {
        $this->id = $id;
        $this->company_name = $company_name;
        $this->email = $email;
        $this->password = $password;
        $this->cnpj = $cnpj;
    }

    public function getCompanyName() {
        return $this->company_name;
    }
}
