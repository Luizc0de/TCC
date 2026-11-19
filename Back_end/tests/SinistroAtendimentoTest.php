<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Controllers\SinistroController;
use App\Repository\ApoliceRepository;
use App\Repository\SinistroRepository;
use App\Services\SinistroService;
use App\Utils\Request;

$db = new PDO('sqlite::memory:');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$conexao = new ReflectionProperty(ApoliceRepository::class, 'db');
$conexao->setAccessible(true);
$conexao->setValue(null, $db);
$db->exec("CREATE TABLE cliente (idCliente INTEGER PRIMARY KEY, name TEXT);
    CREATE TABLE apolice (idApolice INTEGER PRIMARY KEY, numeroApolice TEXT, idCliente INTEGER, idFuncionario INTEGER);
    CREATE TABLE sinistro (idSinistro INTEGER PRIMARY KEY, idApolice INTEGER, descricao TEXT, imagemArquivo TEXT,
        imagemMime TEXT, status TEXT CHECK (status IN ('ABERTO','APROVADO','NEGADO')), dataAbertura TEXT);
    INSERT INTO cliente VALUES (1,'Cliente A'), (2,'Cliente B');
    INSERT INTO apolice VALUES (10,'AP-10',1,2), (20,'AP-20',2,NULL);
    INSERT INTO sinistro (idSinistro,idApolice,status,dataAbertura) VALUES
        (30,10,'ABERTO','2026-01-01'), (31,20,'ABERTO','2026-01-02'), (32,20,'APROVADO','2026-02-01');");

function conferir(bool $condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}
function listar(array $roles, int $id, array $filtros = []): array {
    $_GET = $filtros;
    $request = new Request();
    $request->setUser((object) ['sub' => $id, 'roles' => $roles]);
    ob_start();
    (new SinistroController())->Index($request);
    $lista = json_decode(ob_get_clean(), true, 512, JSON_THROW_ON_ERROR);
    conferir(http_response_code() === 200, 'Falha ao listar os sinistros');
    return $lista;
}
function verificarErro(callable $acao, int $status): void {
    try {
        $acao();
    } catch (DomainException $e) {
        conferir($e->getCode() === $status, 'Código de erro divergente');
        return;
    }
    throw new RuntimeException('Era esperado o erro ' . $status);
}
$atendimento = ['funcionario', 'atendimento'];
conferir(array_column(listar($atendimento, 9), 'idSinistro') === [31, 30, 32], 'Fila completa com os abertos primeiro');
conferir(array_column(listar($atendimento, 9, ['idApolice' => 10]), 'idSinistro') === [30], 'Filtro por apólice');
conferir(array_column(listar(['user'], 2), 'idSinistro') === [32, 31], 'Cliente só consulta as próprias ocorrências');
conferir(array_column(listar(['funcionario', 'vendas'], 2), 'idSinistro') === [30], 'Vendedor só consulta apólices vinculadas');
conferir(listar(['admin'], 9) === [], 'Admin sem as roles de atendimento');
conferir(SinistroService::getById(31, 9, 'atendimento')['cliente'] === 'Cliente B', 'Detalhe de outra apólice na fila');
verificarErro(fn() => SinistroService::getById(31, 2, 'funcionario'), 404);
verificarErro(fn() => SinistroService::analisar(30, 'PAGO'), 400);
verificarErro(fn() => SinistroService::analisar(999, 'NEGADO'), 404);
conferir(SinistroService::analisar(30, 'APROVADO')['status'] === 'APROVADO', 'Aprovação');
SinistroService::analisar(30, 'APROVADO');
verificarErro(fn() => SinistroService::analisar(30, 'NEGADO'), 409);
SinistroService::analisar(31, 'NEGADO');
conferir(listar(['user'], 1)[0]['status'] === 'APROVADO', 'Cliente acompanha a aprovação');
conferir(SinistroService::getById(31, 2, 'cliente')['status'] === 'NEGADO', 'Cliente acompanha a negativa');
$novo = SinistroRepository::save(20, 'Nova ocorrência', ['arquivo' => 'teste.png', 'mime' => 'image/png']);
conferir(SinistroService::getById($novo, 9, 'atendimento')['status'] === 'ABERTO', 'Novo sinistro entra aberto na fila');
echo "OK: fila do Atendimento, permissões, decisões e histórico dos clientes.\n";
