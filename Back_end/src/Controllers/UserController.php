<?php

namespace App\Controllers;  

class UserController
{
    
    public function index() {
        echo "Listando usuários";
    }

    public function store() {
        echo "Criando um novo usuário";
    }

    public function update($id) {
        echo "Atualizando o usuário com ID: $id";
    }

    public function destroy($id) {
        echo "Deletando o usuário com ID: $id";
    }
}
?>