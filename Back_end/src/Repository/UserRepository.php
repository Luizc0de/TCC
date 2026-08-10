<?php 

namespace App\Repository;
use App\Models\UserPF;
use App\Utils\Response;
class UserRepository
    {
        public static function createUserPF($user)
        {
            try {
                $db = new \PDO('mysql:host=localhost;dbname=tcc', 'root', '');
                $db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
                $stmt = $db->prepare("INSERT INTO users_pf (name, email, password, cpf, code) VALUES (:name, :email, :password, :cpf, :code)");
                $name = $user->getName();
                $email = $user->getEmail();
                $password = $user->getPassword();
                $cpf = $user->getCpf();
                $code = $user->getCode();

                $stmt->bindParam(':name', $name);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':password', $password);
                $stmt->bindParam(':cpf', $cpf);
                $stmt->bindParam(':code', $code);
                return $stmt->execute();
            } catch (\PDOException $e) {
                if ($e->getCode() == 23000) { // Código de erro para violação de chave única
                    throw new \Exception('Email ou CPF já cadastrado.', 400);
                } else {
                    throw new \Exception('Erro ao criar usuário: ' . $e->getMessage(), 500);
                }
            }
        }

        public static function getcodebyemail($email)
        {
            $db = new \PDO('mysql:host=localhost;dbname=tcc', 'root', '');
            $stmt = $db->prepare("SELECT code FROM users_pf WHERE email = :email");
            $stmt->bindParam(':email', $email); 
            $stmt->execute();
            return $stmt->fetchColumn();


        }

        public static function changeValidationStatus($email, $status)
        {
            $db = new \PDO('mysql:host=localhost;dbname=tcc', 'root', '');
            $stmt = $db->prepare("UPDATE users_pf SET valid = :status, code = NULL WHERE email = :email");
            $stmt->bindValue(':status', (int) $status, \PDO::PARAM_INT);
            $stmt->bindParam(':email', $email);
            return $stmt->execute();
        }

    }

?>