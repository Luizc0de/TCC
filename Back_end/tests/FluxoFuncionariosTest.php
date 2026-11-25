<?php
// Executar por CLI. Todas as tabelas e a chave de sessão são exclusivas deste teste.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Controllers\AuthController;
use App\Controllers\FuncionarioController;
use App\Core\JwtService;
use App\Core\Router;
use App\Core\Routes;
use App\Repository\ApoliceRepository;
use App\Repository\FuncionarioRepository;
use App\Repository\ParcelaRepository;
use App\Repository\UserRepository;
use App\Services\ApoliceService;

class StripeDeTeste
{
    public static array $emissoes = [];
    public static function emitirParcelasApolice(PDO $db, int $id, int $cliente): array
    {
        self::$emissoes[] = $id;
        return ['Indisponível no teste'];
    }
}
class_alias(StripeDeTeste::class, App\Utils\StripeControl::class);

function conferir(bool $condicao, string $mensagem): void
{
    if (!$condicao) {
        throw new RuntimeException($mensagem);
    }
}
function resposta(callable $acao, int $status): array
{
    ob_start();
    $acao();
    $json = json_decode(ob_get_clean(), true, 512, JSON_THROW_ON_ERROR);
    conferir(http_response_code() === $status, 'Status esperado ' . $status . ', recebido ' . http_response_code() . ' ' . json_encode($json));
    return $json;
}
Dotenv\Dotenv::createImmutable(dirname(__DIR__))->load();
$_ENV['JWT_SECRET'] = bin2hex(random_bytes(32));
require dirname(__DIR__) . '/src/Core/Main.php';
$db = ApoliceRepository::getConnection();
foreach (['funcionario', 'cliente', 'bem', 'apolice', 'parcela'] as $tabela) {
    $db->exec("CREATE TEMPORARY TABLE modelo_$tabela LIKE $tabela");
    $db->exec("CREATE TEMPORARY TABLE $tabela LIKE modelo_$tabela");
}
foreach ([FuncionarioRepository::class, UserRepository::class] as $repositorio) {
    $prop = new ReflectionProperty($repositorio, 'db');
    $prop->setAccessible(true);
    $prop->setValue(null, $db);
}
$_SERVER['REQUEST_METHOD'] = 'POST';
$db->exec("INSERT INTO cliente (name, email, cpf, password, roles) VALUES ('Cliente de teste','cliente@example.test','11111111111','teste','user')");
$cliente = (int) $db->lastInsertId();
$senha = 'Acesso-teste-123';
$db->prepare('INSERT INTO funcionario (name, email, cpf, setor, salario, password, roles) VALUES (?, ?, ?, ?, ?, ?, ?)')
    ->execute(['RH de teste', 'rh@example.test', '00000000000', 'Recursos Humanos', '2000', password_hash($senha, PASSWORD_DEFAULT), '["admin"]']);
function login(string $email, string $senha): object
{
    $_POST = ['email' => $email, 'password' => $senha];
    $dados = resposta(fn() => (new AuthController())->login(), 200);
    $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $dados['token'];
    return JwtService::authenticate();
}
$rh = login('rh@example.test', $senha);
conferir($rh->roles === ['funcionario', 'rh'], 'Setor legado sem herdar admin');
foreach ([['funcionario'], ['rh'], ['user'], []] as $incompletas) {
    conferir(!JwtService::hasRoles((object) ['roles' => $incompletas], ['funcionario', 'rh']), 'Exigir ambas as roles');
}
conferir(JwtService::hasRoles($rh, 'funcionario'), 'Compatibilidade com rotas de uma role');
$cadastro = ['name' => 'Vendas de teste', 'email' => 'vendas@example.test', 'password' => $senha,
    'setor' => 'Vendas', 'cpf' => '529.982.247-25', 'salario' => '3000.50', 'roles' => ['admin', 'rh']];
$_GET['url'] = 'funcionario';
$_POST = $cadastro;
resposta(fn() => Router::dispatch(Routes::routes()), 201);
resposta(fn() => Router::dispatch(Routes::routes()), 400);
$_POST['setor'] = 'admin';
resposta(fn() => (new FuncionarioController())->createFuncionario(), 400);
$vendas = login('vendas@example.test', $senha);
conferir($vendas->roles === ['funcionario', 'vendas'], 'Permissões devem vir do setor cadastrado');
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['url'] = 'apolices/coberturas';
$catalogo = resposta(fn() => Router::dispatch(Routes::routes()), 200);
conferir(isset($catalogo['VEICULO']['comuns']['COLISAO'], $catalogo['TELEFONE']['profissionais']['TRANSACOES_DIGITAIS'],
    $catalogo['NOTEBOOK']['profissionais']['ACESSORIOS_PROFISSIONAIS']), 'Catálogo dos três produtos');
$_SERVER['REQUEST_METHOD'] = 'POST';
$body = ['status' => 'ATIVA', 'idCliente' => $cliente, 'idFuncionario' => $rh->sub, 'tipoApolice' => 'NOTEBOOK',
    'valorTotal' => '120.01', 'quantidadeParcelas' => 2, 'FirstParcelNow' => false, 'daysfromfirstparcel' => 10,
    'coberturas' => ['DANOS_ELETRICOS', 'ACESSORIOS_PROFISSIONAIS'],
    'diaVencimento' => 15, 'bem' => ['tipo' => 'NOTEBOOK', 'descricao' => 'Notebook de teste', 'finalidade' => 'PROFISSIONAL',
    'modelo' => 'Modelo A', 'numeroSerie' => 'SERIE-1']];
$_GET['url'] = 'apolice';
foreach ([null, [], 'DANOS_ELETRICOS', ['VIDROS'], ['DANOS_ELETRICOS','DANOS_ELETRICOS'], [['codigo' => 'DANOS_ELETRICOS']]] as $invalidas) {
    $_POST = array_replace($body, ['coberturas' => $invalidas]);
    resposta(fn() => Router::dispatch(Routes::routes()), 400);
}
$_POST = $body;
$_POST['bem']['finalidade'] = 'PESSOAL';
resposta(fn() => Router::dispatch(Routes::routes()), 400);
$_POST = $body;
$aprovacao = resposta(fn() => Router::dispatch(Routes::routes()), 201);
$recusa = resposta(fn() => Router::dispatch(Routes::routes()), 201);
conferir(array_column($aprovacao['coberturas'], 'codigo') === $body['coberturas'], 'Criação com duas coberturas');
conferir($aprovacao['coberturas'][1]['descricao'] === $catalogo['NOTEBOOK']['profissionais']['ACESSORIOS_PROFISSIONAIS'], 'Descrição do catálogo');
$consulta = $db->prepare('SELECT coberturas FROM apolice WHERE idApolice = ?');
$consulta->execute([$aprovacao['idApolice']]);
conferir(json_decode($consulta->fetchColumn(), true, 512, JSON_THROW_ON_ERROR) === $aprovacao['coberturas'], 'JSON gravado em LONGTEXT');
conferir(ApoliceRepository::emAnalise()[0]['coberturas'] === $aprovacao['coberturas'], 'Coberturas exibidas ao risco');
$detalhe = ApoliceRepository::getApolice($aprovacao['numeroApolice'], $cliente, false);
conferir($detalhe['coberturas'] === $aprovacao['coberturas'], 'Coberturas visíveis ao titular');
conferir($aprovacao['status'] === 'EM_ANALISE' && count(StripeDeTeste::$emissoes) === 0, 'Criação sem cobrança');
conferir(count(ApoliceRepository::getAllApolices($vendas->sub, true)) === 2, 'Vínculo com vendedor autenticado');
conferir(ParcelaRepository::getAllParcelas($cliente) === [], 'Parcelas ocultas antes da decisão');
$parcela = (int) $db->query('SELECT MIN(idParcela) FROM parcela')->fetchColumn();
conferir(ParcelaRepository::getParcelaById($parcela, $cliente) === null, 'Parcela em análise protegida por ID');
$_POST['bem']['modelo'] = '';
resposta(fn() => Router::dispatch(Routes::routes()), 400);
$_POST = $body;
$_POST['idCliente'] = $cliente + 1;
resposta(fn() => Router::dispatch(Routes::routes()), 404);
conferir(count(ApoliceRepository::emAnalise()) === 2, 'Fila inclui todas as propostas válidas');
$decisao = resposta(fn() => ApoliceService::analisar($aprovacao['idApolice'], 'APROVADA'), 200);
conferir(isset($decisao['avisoStripe']) && $decisao['status'] === 'APROVADA', 'Falha de emissão preserva aprovação');
resposta(fn() => ApoliceService::analisar($recusa['idApolice'], 'RECUSADA'), 200);
resposta(fn() => ApoliceService::analisar($aprovacao['idApolice'], 'RECUSADA'), 409);
resposta(fn() => ApoliceService::analisar(2147483647, 'APROVADA'), 404);
conferir(StripeDeTeste::$emissoes === [$aprovacao['idApolice']], 'Somente a aprovação emite cobrança');
conferir(ApoliceRepository::emAnalise() === [], 'Fila vazia após decisões');
conferir(count(ParcelaRepository::getAllParcelas($cliente)) === 2, 'Somente parcelas da apólice aprovada disponíveis');
conferir((int) $db->query("SELECT COUNT(*) FROM parcela WHERE status = 'CANCELADA'")->fetchColumn() === 2, 'Recusa cancela cronograma');
$db->exec("ALTER TABLE apolice MODIFY tipoApolice ENUM('VEICULO','NOTEBOOK','ELETRONICO') NOT NULL");
$_POST = $body;
$notebook = resposta(fn() => Router::dispatch(Routes::routes()), 201);
$tipo = $db->prepare('SELECT tipoApolice FROM apolice WHERE idApolice = ?');
$tipo->execute([$notebook['idApolice']]);
conferir($tipo->fetchColumn() === 'NOTEBOOK', 'Enum com tipo de apólice específico para notebook');
foreach ([
    ['VEICULO', ['tipo' => 'VEICULO', 'marca' => 'Teste', 'modeloVeiculo' => 'A', 'placa' => 'QA12345', 'chassi' => 'QA123456'],
        ['COLISAO', 'USO_COMERCIAL_APP']],
    ['ELETRONICO', ['tipo' => 'TELEFONE', 'modelo' => 'B', 'numeroSerie' => 'QA1234', 'imei' => '111111111111111'],
        ['QUEBRA_ACIDENTAL', 'TRANSACOES_DIGITAIS']],
] as [$tipoApolice, $bem, $codigos]) {
    $_POST = $body;
    $_POST['tipoApolice'] = $tipoApolice;
    $_POST['bem'] = $bem + ['descricao' => 'Bem de teste', 'finalidade' => 'PROFISSIONAL'];
    $_POST['coberturas'] = $codigos;
    $criacao = resposta(fn() => Router::dispatch(Routes::routes()), 201);
    conferir(array_column($criacao['coberturas'], 'codigo') === $codigos, 'Coberturas para ' . $bem['tipo']);
}
$_SERVER['REQUEST_METHOD'] = 'GET';
$_GET['url'] = 'apolices/vendas/' . $recusa['idApolice'];
$detalheVenda = resposta(fn() => Router::dispatch(Routes::routes()), 200);
conferir($detalheVenda['status'] === 'RECUSADA' && $detalheVenda['coberturas'] === $recusa['coberturas'], 'Vendedor acompanha a apólice após a decisão');
$db->prepare("UPDATE parcela SET dataVencimento = '2000-01-01' WHERE idApolice = ? AND numeroParcela = 1")
    ->execute([$notebook['idApolice']]);
$aprovadaComAtraso = resposta(fn() => ApoliceService::analisar($notebook['idApolice'], 'APROVADA'), 200);
conferir($aprovadaComAtraso['status'] === 'INADIMPLENTE', 'Aprovação do risco informa o status financeiro quando a parcela já venceu');
echo "OK: cadastro, login, setores, vendas com múltiplas coberturas, fila, decisões e cobranças em tabelas temporárias.\n";
