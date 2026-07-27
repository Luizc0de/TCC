<?php 

namespace App\Services;
use App\Utils\Response;
use App\Models\UserPF;
use App\Models\UserPJ;

class UserServices {
    public static function createUserPF($fields) {
        $user = new UserPF(
            null,
            $fields['name'],
            $fields['email'],
            $fields['password'],
            $fields['cpf']
        );
       response::json([
        'message' => 'User PF created successfully', 'data' => $user->getname() ], 201);
    }

    public static function createUserPJ($data) {
        $user = new UserPJ(
            null,
            $data['company_name'],
            $data['email'],
            $data['password'],
            $data['cnpj']
        );

        Response::json([
            'message' => 'User PJ created successfully',
            'data' => $user->getCompanyName()
        ], 201);
    }
}

?>