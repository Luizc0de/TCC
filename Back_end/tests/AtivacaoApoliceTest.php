<?php
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require dirname(__DIR__) . '/vendor/autoload.php';

use App\Repository\ApoliceRepository;
use App\Services\ParcelaService;
use App\Utils\StripeControl;
use Stripe\ApiRequestor;
use Stripe\HttpClient\ClientInterface;

Dotenv\Dotenv::createImmutable(dirname(__DIR__))->load();
$_ENV['STRIPE_WEBHOOK_SECRET'] = bin2hex(random_bytes(32));
$_ENV['Stripe_API_KEY'] = 'sk_test_local';
$db = ApoliceRepository::getConnection();
$db->exec("CREATE TEMPORARY TABLE apolice (idApolice INT PRIMARY KEY, idCliente INT, numeroApolice VARCHAR(20), status VARCHAR(20)) ENGINE=InnoDB");
$db->exec("CREATE TEMPORARY TABLE parcela (idParcela INT PRIMARY KEY, idApolice INT, numeroParcela INT, valorCentavos INT,
    status VARCHAR(20), dataVencimento DATE, stripeInvoiceId VARCHAR(40) UNIQUE, linkPagamento VARCHAR(255)) ENGINE=InnoDB");
$db->exec("CREATE TEMPORARY TABLE cliente (idCliente INT PRIMARY KEY, name TEXT, email TEXT, cpf TEXT, stripeCustomerId TEXT)");
$db->exec("INSERT INTO cliente VALUES (1,'Teste','teste@example.test','','cus_teste')");

function conferir(bool $condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}
function fatura(string $id, int $valor = 1000): array {
    return ['id' => $id, 'object' => 'invoice', 'status' => 'paid', 'currency' => 'brl',
        'amount_paid' => $valor, 'hosted_invoice_url' => null];
}
function notificar(array $invoice, ?string $secret = null, string $tipo = 'invoice.paid'): void {
    $payload = json_encode(['id' => 'evt_teste', 'object' => 'event', 'type' => $tipo,
        'data' => ['object' => $invoice]], JSON_THROW_ON_ERROR);
    $hora = time();
    $hash = hash_hmac('sha256', "$hora.$payload", $secret ?? $_ENV['STRIPE_WEBHOOK_SECRET']);
    ParcelaService::receberEventoStripe($payload, "t=$hora,v1=$hash");
}
function statusApolice(int $id): string {
    $consulta = ApoliceRepository::getConnection()->prepare('SELECT status FROM apolice WHERE idApolice = ?');
    $consulta->execute([$id]);
    return $consulta->fetchColumn();
}
$apolice = $db->prepare('INSERT INTO apolice VALUES (?, 1, NULL, ?)');
$parcela = $db->prepare("INSERT INTO parcela VALUES (?, ?, ?, 1000, ?, DATE_ADD(CURRENT_DATE, INTERVAL 2 DAY), ?, NULL)");
foreach ([1 => 'APROVADA', 2 => 'APROVADA', 3 => 'APROVADA', 4 => 'APROVADA', 5 => 'CANCELADA',
    6 => 'EM_ANALISE', 7 => 'RECUSADA', 8 => 'SUSPENSA', 9 => 'APROVADA'] as $id => $status) {
    $apolice->execute([$id, $status]);
    $parcela->execute([$id, $id, 1, $id === 4 ? 'PAGA' : 'PENDENTE', 'in_' . $id]);
}
$parcela->execute([10, 1, 2, 'ABERTA', 'in_10']);
notificar(fatura('in_10'));
conferir(statusApolice(1) === 'APROVADA', 'Pagar a segunda parcela antes da primeira');
notificar(fatura('in_1'), null, 'invoice.created');
foreach ([[fatura('in_1'), 'incorreto', 400], [fatura('in_1', 50), null, 409]] as [$dados, $secret, $codigo]) {
    try {
        notificar($dados, $secret);
        throw new RuntimeException('Notificação inválida aceita');
    } catch (DomainException $e) {
        conferir($e->getCode() === $codigo, 'Código da notificação inválida');
    }
}
conferir(statusApolice(1) === 'APROVADA', 'Pagamento ainda não confirmado');
notificar(fatura('in_1'));
notificar(fatura('in_1'), null, 'invoice.payment_succeeded');
conferir(statusApolice(1) === 'ATIVA' && ParcelaService::getParcelaById(1, 1)['status'] === 'PAGA', 'Webhook e reenvio');

ApiRequestor::setHttpClient(new class implements ClientInterface {
    public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1', $maxNetworkRetries = null) {
        conferir($method === 'get', 'Somente consulta de fatura simulada');
        return [json_encode(fatura(basename($absUrl))), 200, []];
    }
});
$manual = ParcelaService::atualizarPagamento(2, 1);
conferir($manual['status'] === 'PAGA' && $manual['statusApolice'] === 'ATIVA', 'Confirmação manual');
conferir(StripeControl::emitirParcelasApolice($db, 3, 1) === [] && statusApolice(3) === 'ATIVA', 'Emissão retomada com fatura paga');
foreach ([5 => 'CANCELADA', 6 => 'EM_ANALISE', 7 => 'RECUSADA', 8 => 'SUSPENSA'] as $id => $esperado) {
    notificar(fatura('in_' . $id));
    conferir(statusApolice($id) === $esperado, 'Preservar ' . $esperado);
}
$sql = file_get_contents(dirname(__DIR__) . '/database/migrations/20261125_ativar_apolices_primeira_parcela_paga.sql');
conferir($db->exec($sql) === 1 && statusApolice(4) === 'ATIVA', 'Corrigir a primeira parcela paga antes da publicação');
conferir($db->exec($sql) === 0 && statusApolice(9) === 'APROVADA', 'Correção repetida sem ativar apólice pendente');

$hoje = new DateTimeImmutable('today', new DateTimeZone('America/Sao_Paulo'));
$vencimento = $db->prepare('UPDATE parcela SET dataVencimento = ? WHERE idParcela = ?');
$vencimento->execute([$hoje->format('Y-m-d'), 9]);
conferir(ParcelaService::getParcelaById(9, 1)['statusApolice'] === 'APROVADA', 'Parcela que vence hoje está em dia');
$ontem = $hoje->modify('-1 day')->format('Y-m-d');
$vencimento->execute([$ontem, 9]);
$parcela->execute([11, 9, 2, 'ABERTA', 'in_11']);
$vencimento->execute([$ontem, 11]);
conferir(ParcelaService::getAllParcelas(1, 9)[0]['statusApolice'] === 'INADIMPLENTE', 'Consulta reconhece os vencimentos anteriores a hoje');
notificar(fatura('in_9'));
conferir(statusApolice(9) === 'INADIMPLENTE', 'Pagamento da primeira preserva o atraso da segunda');
notificar(fatura('in_11'));
conferir(statusApolice(9) === 'ATIVA', 'Última vencida paga regulariza a apólice');
$parcela->execute([12, 9, 3, 'ABERTA', 'in_12']);
$vencimento->execute([$ontem, 12]);
ApoliceRepository::atualizarSituacaoFinanceira($db);
conferir(statusApolice(9) === 'INADIMPLENTE', 'Rotina diária identifica novo atraso na apólice ativa');
conferir(ApoliceRepository::atualizarSituacaoFinanceira($db) === 0, 'Reprocessamento diário idempotente');
$regularizada = ParcelaService::atualizarPagamento(12, 1);
conferir($regularizada['statusApolice'] === 'ATIVA', 'Sincronização manual regulariza a última vencida');
$apolice->execute([13, 'APROVADA']);
$parcela->execute([13, 13, 1, 'ABERTA', 'in_13']);
$parcela->execute([14, 13, 2, 'ABERTA', 'in_14']);
$vencimento->execute([$ontem, 14]);
conferir(ParcelaService::getParcelaById(13, 1)['statusApolice'] === 'INADIMPLENTE', 'Atraso de outra parcela aparece no detalhe');
App\Repository\ParcelaRepository::atualizarPagamento(14, 'in_14', 'CANCELADA', null);
conferir(statusApolice(13) === 'APROVADA', 'Sem atraso e aguardando pagamento da primeira');
foreach ([5 => 'CANCELADA', 6 => 'EM_ANALISE', 7 => 'RECUSADA', 8 => 'SUSPENSA'] as $id => $esperado) {
    $parcela->execute([$id + 20, $id, 2, 'ABERTA', 'in_extra_' . $id]);
    $vencimento->execute([$ontem, $id + 20]);
    ApoliceRepository::atualizarSituacaoFinanceira($db, ['idApolice' => $id]);
    conferir(statusApolice($id) === $esperado, 'Vencimento preserva ' . $esperado);
}
echo "OK: ativação, inadimplência e regularização por parcela em tabelas temporárias.\n";
