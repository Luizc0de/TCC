<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Repository\ApoliceRepository;
use App\Repository\FuncionarioRepository;
use App\Repository\UserRepository;
use App\Services\AuthServices;
use App\Services\RecuperacaoSenhaService as Recuperacao;

class CaixaDeTeste
{
    public static array $codigos = [];
    public static bool $indisponivel = false;

    public static function sendPasswordResetCode(string $email, string $codigo, int $minutos): void
    {
        if (self::$indisponivel) throw new \PHPMailer\PHPMailer\Exception('SMTP de teste indisponível');
        $pendente = ApoliceRepository::getConnection()->query('SELECT tipoConta FROM recuperacao_senha WHERE codigoHash IS NOT NULL AND expiraEm = 0')->fetchColumn();
        $conta = ['tipoConta' => $pendente, 'email' => $email];
        falha(fn() => Recuperacao::solicitar($conta), 429);
        falha(fn() => Recuperacao::verificar($conta + ['codigo' => $codigo]), 400);
        conferir($email === 'pessoa@example.test' && strlen($codigo) === 6 && ctype_digit($codigo) && $minutos === 10, 'E-mail com código de seis dígitos');
        self::$codigos[] = $codigo;
    }
}
class_alias(CaixaDeTeste::class, App\Utils\Email::class);
function conferir(bool $ok, string $mensagem): void {
    if (!$ok) throw new RuntimeException($mensagem);
}
function falha(callable $acao, int $status): void {
    try { $acao(); } catch (DomainException $e) {
        conferir($e->getCode() === $status, 'Código HTTP inesperado');
        return;
    }
    throw new RuntimeException('Operação deveria ter falhado');
}
Dotenv\Dotenv::createImmutable(dirname(__DIR__))->load();
$_ENV['JWT_SECRET'] = bin2hex(random_bytes(32));
$db = ApoliceRepository::getConnection();
foreach ([UserRepository::class, FuncionarioRepository::class] as $repo) {
    $prop = new ReflectionProperty($repo, 'db');
    $prop->setAccessible(true);
    $prop->setValue(null, $db);
}
$db->exec("CREATE TEMPORARY TABLE cliente (idCliente INT PRIMARY KEY, name TEXT, email VARCHAR(255), password VARCHAR(255), cpf TEXT, roles TEXT)");
$db->exec("CREATE TEMPORARY TABLE funcionario (idFuncionario INT PRIMARY KEY, name TEXT, email VARCHAR(255), password VARCHAR(255), cpf TEXT, roles TEXT, setor TEXT, salario INT)");
$sql = file_get_contents(dirname(__DIR__) . '/database/migrations/20261126_recuperacao_senha.sql');
$db->exec(str_replace('CREATE TABLE IF NOT EXISTS', 'CREATE TEMPORARY TABLE', $sql));
$email = 'pessoa@example.test';
$cliente = ['email' => $email, 'tipoConta' => 'cliente'];
$funcionario = ['email' => $email, 'tipoConta' => 'funcionario'];
$db->prepare("INSERT INTO cliente VALUES (1,'Cliente',?,?,'111','user')")->execute([$email,password_hash('Inicial-cliente', PASSWORD_DEFAULT)]);
$db->prepare("INSERT INTO funcionario VALUES (1,'Atendente',?,?,'222','[]','atendimento',1000)")->execute([$email,password_hash('Inicial-atendente', PASSWORD_DEFAULT)]);
$desconhecido = Recuperacao::solicitar(['email' => 'outro@example.test','tipoConta' => 'cliente']);
conferir(Recuperacao::solicitar($cliente) === $desconhecido, 'Resposta pública sem expor cadastro');
Recuperacao::solicitar($cliente);
conferir(count(CaixaDeTeste::$codigos) === 1, 'Intervalo entre envios');
$prova = $cliente + ['codigo' => CaixaDeTeste::$codigos[0]];
falha(fn() => Recuperacao::verificar($funcionario + ['codigo' => $prova['codigo']]), 400);
falha(fn() => Recuperacao::redefinir(['password' => 'Outra-senha']), 403);
$token = Recuperacao::verificar($prova)['token'];
falha(fn() => Recuperacao::verificar($prova), 400);
falha(fn() => Recuperacao::redefinir(['token' => $token,'password' => 'curta']), 400);
falha(fn() => Recuperacao::redefinir(['token' => $token,'password' => '        ']), 400);
$troca = ['token' => $token,'password' => 'Nova-cliente'];
Recuperacao::redefinir($troca);
falha(fn() => Recuperacao::redefinir($troca), 403);
conferir(AuthServices::login($email, 'Nova-cliente') !== null && AuthServices::login($email, 'Inicial-cliente') === null, 'Login do cliente com a nova senha');
conferir(AuthServices::login($email, 'Inicial-atendente') !== null, 'Funcionário com o mesmo e-mail preservado');

Recuperacao::solicitar($funcionario);
$codigo = end(CaixaDeTeste::$codigos);
$errado = $codigo === '000000' ? '000001' : '000000';
for ($i = 0; $i < 5; $i++) falha(fn() => Recuperacao::verificar($funcionario + ['codigo' => $errado]), 400);
$verificar = fn() => Recuperacao::verificar($funcionario + ['codigo' => end(CaixaDeTeste::$codigos)]);
falha($verificar, 400);
$db->exec('UPDATE recuperacao_senha SET ultimoEnvio = 0');
falha(fn() => Recuperacao::solicitar($funcionario), 429);
conferir(count(CaixaDeTeste::$codigos) === 2, 'Reenvio não contorna limite de tentativas');
$db->exec('UPDATE recuperacao_senha SET inicioJanela = 0');
Recuperacao::solicitar($funcionario);
$db->exec('UPDATE recuperacao_senha SET expiraEm = 0');
falha($verificar, 400);
$db->exec('UPDATE recuperacao_senha SET ultimoEnvio = 0');
Recuperacao::solicitar($funcionario);
$expirado = $verificar()['token'];
$db->exec('UPDATE recuperacao_senha SET expiraEm = 0, ultimoEnvio = 0');
falha(fn() => Recuperacao::redefinir(['token' => $expirado, 'password' => 'Nova-atendente']), 403);
Recuperacao::solicitar($funcionario);
Recuperacao::redefinir(['token' => $verificar()['token'], 'password' => 'Nova-atendente']);
conferir(AuthServices::login($email, 'Nova-atendente') !== null && AuthServices::login($email, 'Inicial-atendente') === null, 'Login do funcionário com a nova senha');
CaixaDeTeste::$indisponivel = true;
falha(fn() => Recuperacao::solicitar($cliente), 503);
conferir($db->query('SELECT codigoHash FROM recuperacao_senha')->fetchColumn() === null, 'Falha no envio invalida o código');
falha(fn() => Recuperacao::solicitar($cliente), 503);
$db->exec('UPDATE recuperacao_senha SET ultimoEnvio = 0, envios = 3');
falha(fn() => Recuperacao::solicitar($cliente), 503);
$db->exec('UPDATE recuperacao_senha SET inicioJanela = 0');
CaixaDeTeste::$indisponivel = false;
Recuperacao::solicitar($cliente);
conferir(isset(Recuperacao::verificar($cliente + ['codigo' => end(CaixaDeTeste::$codigos)])['token']), 'Recuperação após o SMTP voltar a aceitar envios');
echo "OK: recuperação, tentativas, validade, uso único, envio e login dos dois perfis em tabelas temporárias.\n";
