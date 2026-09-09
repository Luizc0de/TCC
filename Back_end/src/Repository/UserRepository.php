<?php

namespace App\Repository;
use App\Models\UserPF;

class UserRepository
    {
        private static $db = null;

        private static function getConnection()
        {
            if (self::$db === null) {
                $dsn = sprintf(
                    'mysql:host=%s;dbname=%s;charset=utf8mb4',
                    $_ENV['DB_HOST'],
                    $_ENV['DB_NAME']
                );

                self::$db = new \PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS']);
                self::$db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            }

            return self::$db;
        }

        public static function createUserPF($user)
        {
            try {
                $db = self::getConnection();
                $stmt = $db->prepare("INSERT INTO users_pf (name, email, password, cpf, code, roles) VALUES (:name, :email, :password, :cpf, :code, :roles)");
                $name = $user->getName();
                $email = $user->getEmail();
                $password = $user->getPassword();
                $cpf = $user->getCpf();
                $code = $user->getCode();
                $roles = 'user';

                $stmt->bindParam(':name', $name);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':password', $password);
                $stmt->bindParam(':cpf', $cpf);
                $stmt->bindParam(':code', $code);
                $stmt->bindParam(':roles', $roles);
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
            $db = self::getConnection();
            $stmt = $db->prepare("SELECT code FROM users_pf WHERE email = :email");
            $stmt->bindParam(':email', $email); 
            $stmt->execute();
            return $stmt->fetchColumn();


        }

        public static function changeValidationStatus($email, $status)
        {
            $db = self::getConnection();
            $stmt = $db->prepare("UPDATE users_pf SET valid = :status, code = NULL WHERE email = :email");
            $stmt->bindValue(':status', (int) $status, \PDO::PARAM_INT);
            $stmt->bindParam(':email', $email);
            return $stmt->execute();
        }

        public static function getUserByEmail($email)
        {
            $db = self::getConnection();
            $stmt = $db->prepare("SELECT * FROM users_pf WHERE email = :email");
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            $userData = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($userData) {
                $user = new UserPF(
                    $userData['id'],
                    $userData['name'],
                    $userData['email'],
                    $userData['password'],
                    $userData['cpf'],
                    null // O código não é necessário aqui
                );
                $user->roles = $userData['roles'];
                return $user;
            }

            return null; // Retorna null se o usuário não for encontrado
        }

        public static function getUserById($id)
        {
            $db = self::getConnection();
            $stmt = $db->prepare("SELECT * FROM users_pf WHERE id = :id");
            $stmt->bindParam(':id', $id);
            $stmt->execute();
            $userData = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($userData) {
                $user = new UserPF(
                    $userData['id'],
                    $userData['name'],
                    $userData['email'],
                    $userData['password'],
                    $userData['cpf'],
                    null // O código não é necessário aqui
                );
                $user->roles = $userData['roles'];
                return $user;
            }

            return null; // Retorna null se o usuário não for encontrado
        }

    }

?>