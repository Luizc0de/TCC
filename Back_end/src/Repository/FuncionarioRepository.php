<?php 

namespace App\Repository;
use App\Models\Funcionario;

class FuncionarioRepository
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
    public static function save(Funcionario $funcionario)
    {   
        try {
            $db = self::getConnection();
            $stmt = $db->prepare('INSERT INTO funcionario (name, email, password, setor, cpf, salario) VALUES (:name, :email, :password, :setor, :cpf, :salario)');
            $name = $funcionario->getName();
            $email = $funcionario->getEmail();
            $password = $funcionario->getPassword();
            $setor = $funcionario->getSetor();
            $cpf = $funcionario->getCpf();
            $salario = $funcionario->getSalario();

            $stmt->execute([
                ':name' => $name,
                ':email' => $email,
                ':password' => $password,
                ':setor' => $setor,
                ':cpf' => $cpf,
                ':salario' => $salario
            ]);
        }catch (\PDOException $e) {
            if ($e->getCode() == 23000) { // Código de erro para violação de chave única
                throw new \Exception('Email ou CPF já cadastrado.', 400);
            } else {
                throw new \Exception('Erro ao criar usuário: ' . $e->getMessage(), 500);
            }
        }
    }

    public static function findById($id)
    {
        
    }

    public static function updatePassword($id, $password)
    {
        $db = self::getConnection();
        $stmt = $db->prepare('UPDATE funcionario SET password = :password WHERE idFuncionario = :id');

        return $stmt->execute([
            ':id' => $id,
            ':password' => $password
        ]);
    }

    public static function findByEmail($email)
    {
        $db = self::getConnection();
        $stmt = $db->prepare('SELECT funcionario.*, funcionario.idFuncionario AS id FROM funcionario WHERE email = :email');
        $stmt->execute([':email' => $email]);
        $funcionarioData = $stmt->fetch(\PDO::FETCH_ASSOC);

        if (!$funcionarioData) {
            return null;
        }

        $funcionario = new Funcionario(
            $funcionarioData['name'],
            $funcionarioData['email'],
            $funcionarioData['password'],
            $funcionarioData['setor'],
            $funcionarioData['cpf'],
            $funcionarioData['salario'],
            $funcionarioData['id']
        );
        $funcionario->roles = ['funcionario'];

        return $funcionario;
    }
}


?>