<?php 

namespace App\Models;  

class Funcionario
{
    private ?int $id;
    private string $name;
    private string $email;
    private string $password;
    private string $setor;
    private string $cpf;
    private float $salario;
    public array $roles;

    public function __construct($name, $email, $password, $setor, $cpf, $salario, $id = null, ?array $roles = null)
    {
        $this->id = $id;
        $this->name = $name;
        $this->email = $email;
        $this->password = $password;
        $this->setor = $setor;
        $this->roles = ['funcionario'];
        foreach ($roles ?? [] as $role) {
            $sector = self::normalizarSetor($role);
            if ($sector !== null && !in_array($sector, $this->roles, true)) {
                $this->roles[] = $sector;
            }
        }
        // Cadastros anteriores gravavam apenas ["admin"] ou não possuíam roles de setor.
        if (count($this->roles) === 1 && self::normalizarSetor($setor) !== null) {
            $this->roles[] = self::normalizarSetor($setor);
        }
        $this->cpf = $cpf;
        $this->salario = $salario;  
    }

    public static function normalizarSetor($setor): ?string
    {
        if (!is_string($setor)) {
            return null;
        }
        $nome = strtr(mb_strtolower(trim($setor)), ['á' => 'a', 'ç' => 'c']);
        $nome = preg_replace('/[\s_-]+/', '_', $nome);
        return match ($nome) {
            'vendas', 'financeiro', 'atendimento' => $nome,
            'rh', 'recursos_humanos' => 'rh',
            'risco', 'analise_de_risco', 'analise_risco' => 'analise_risco',
            default => null,
        };
    }

    public function getId()
    {
        return $this->id;
    }

    public function getName()
    {
        return $this->name;
    }

    public function getEmail()
    {
        return $this->email;
    }

    public function getPassword()
    {
        return $this->password;
    }

    public function setPassword($password)
    {
        $this->password = $password;
    }

    public function getSetor()
    {
        return $this->setor;
    }

    public function getCpf()
    {
        return $this->cpf;
    }
    public function getSalario()
    {
        return $this->salario;
    }
}


?>
