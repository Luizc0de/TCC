<?php

use App\Services\FuncionarioService;
use Dotenv\Dotenv;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/vendor/autoload.php';

function lerCampo(string $rotulo): string
{
    fwrite(STDOUT, $rotulo . ': ');
    $linha = fgets(STDIN);
    if ($linha === false || trim($linha) === '') {
        throw new DomainException('Cadastro interrompido. Preencha todos os campos.');
    }
    return trim($linha);
}

try {
    Dotenv::createImmutable(dirname(__DIR__))->load();
    fwrite(STDOUT, "Cadastro de funcionário de Recursos Humanos\n");
    $nome = lerCampo('Nome completo');
    $email = lerCampo('E-mail de acesso');
    $cpf = lerCampo('CPF');
    $salario = lerCampo('Salário em reais (ex. 2500,00)');
    $senha = bin2hex(random_bytes(12));

    FuncionarioService::cadastrar([
        'name' => $nome,
        'email' => $email,
        'cpf' => $cpf,
        'salario' => $salario,
        'password' => $senha,
        'setor' => 'rh',
    ]);
    echo "\nRH cadastrado. Guarde a senha para entrar no painel.\nE-mail: $email\nSenha: $senha\n";
} catch (DomainException $e) {
    fwrite(STDERR, $e->getMessage() . PHP_EOL);
    exit(1);
} catch (Throwable $e) {
    fwrite(STDERR, "Falha no cadastro. Verifique o MySQL e a configuração do Back_end/.env.\n");
    exit(1);
}
