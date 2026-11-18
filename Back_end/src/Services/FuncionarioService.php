<?php 

namespace App\Services;
use App\Models\Funcionario;
use App\Repository\FuncionarioRepository;
use App\Utils\Response;

class FuncionarioService
{
    public static function createFuncionario($fields)
    {
        try {
            self::cadastrar($fields);
            Response::json(['message' => 'Funcionário cadastrado com sucesso.'], 201);
        } catch (\DomainException $e) {
            Response::json(['error' => $e->getMessage()], $e->getCode());
        } catch (\Throwable $e) {
            Response::json(['error' => 'Não foi possível cadastrar o funcionário.'], 500);
        }
    }

    public static function cadastrar(array $fields): void
    {
        $setor = Funcionario::normalizarSetor($fields['setor']);
        if ($setor === null) {
            throw new \DomainException('Selecione um setor válido.', 400);
        }
        $name = trim($fields['name']);
        $email = trim($fields['email']);
        if (!is_string($fields['name']) || $name === '' || mb_strlen($name) > 255
            || strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new \DomainException('Informe um nome e um e-mail válidos.', 400);
        }
        $password = $fields['password'];
        if (!is_string($password) || mb_strlen($password) < 8 || strlen($password) > 72 || str_contains($password, "\0")) {
            throw new \DomainException('A senha deve ter pelo menos 8 caracteres e no máximo 72 bytes.', 400);
        }
        $cpf = str_replace(['.', '-'], '', $fields['cpf']);
        if (!self::cpfValido($cpf)) {
            throw new \DomainException('Informe um CPF válido.', 400);
        }
        $salario = str_replace(',', '.', $fields['salario']);
        if (!preg_match('/^\d{1,8}(\.\d{1,2})?$/D', $salario)) {
            throw new \DomainException('Informe um salário válido em reais.', 400);
        }
        $funcionario = new Funcionario(
            $name, $email, password_hash($password, PASSWORD_DEFAULT), $setor, $cpf, $salario
        );
        FuncionarioRepository::save($funcionario);
    }

    private static function cpfValido(string $cpf): bool
    {
        if (!preg_match('/^\d{11}$/D', $cpf) || preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }
        for ($i = 9; $i <= 10; $i++) {
            $soma = 0;
            for ($j = 0; $j < $i; $j++) {
                $soma += (int) $cpf[$j] * ($i + 1 - $j);
            }
            if ((($soma * 10) % 11) % 10 !== (int) $cpf[$i]) {
                return false;
            }
        }
        return true;
    }

    public static function changepassword($fields)
    {
        $funcionario = FuncionarioRepository::findByEmail($fields['email']);
        if (!$funcionario) {
            throw new \Exception('Funcionario not found');
        }
        if (!password_verify($fields['old_password'], $funcionario->getPassword())) {
            throw new \Exception('Old password does not match');
        }
        FuncionarioRepository::updatePassword(
            $funcionario->getId(),
            password_hash($fields['new_password'], PASSWORD_DEFAULT)
        );
    }

    public static function getProfile($id)
    {
        return FuncionarioRepository::findById($id);
    }
}

?>
