<?php
// Usa apenas tabelas TEMPORARY na propria conexao. Nao altera registros reais.
require dirname(__DIR__) . '/vendor/autoload.php';
Dotenv\Dotenv::createImmutable(dirname(__DIR__))->load();
use App\Repository\ApoliceRepository;
use App\Controllers\ApoliceController;
use App\Utils\Request;
use App\Utils\Response;
$db = ApoliceRepository::getConnection();
$db->exec("CREATE TEMPORARY TABLE cliente (idCliente INT PRIMARY KEY, name VARCHAR(100))");
$db->exec("CREATE TEMPORARY TABLE bem (id_bem INT PRIMARY KEY, tipo_bem VARCHAR(30), finalidade VARCHAR(30), descricao TEXT, valor_avaliacao DECIMAL(12,2), marca VARCHAR(60), placa VARCHAR(20), chassi VARCHAR(50), modelo_veiculo VARCHAR(60), data_fabricacao DATE, modelo VARCHAR(60), numero_serie VARCHAR(60), imei VARCHAR(60))");
$db->exec("CREATE TEMPORARY TABLE apolice (idApolice INT PRIMARY KEY, numeroApolice VARCHAR(60), dataAssinatura DATE, dataVencimento DATE, status VARCHAR(30), tipoApolice VARCHAR(30), valorTotal DECIMAL(12,2), quantidadeParcelas INT, idCliente INT, idFuncionario INT, id_bem INT, coberturas LONGTEXT NOT NULL)");
$db->exec("INSERT INTO cliente VALUES (1,'Cliente A'),(2,'Cliente B')");
$db->exec("INSERT INTO bem (id_bem,tipo_bem,descricao,marca) VALUES (4,'VEICULO','Bem de teste','Marca')");
$db->exec("INSERT INTO apolice VALUES (7,'AP-OWN','2026-01-01','2027-01-01','ATIVA','VEICULO',1200,12,1,2,4,''),(8,'AP-OTHER','2026-01-01','2027-01-01','ATIVA','VEICULO',2400,12,2,1,4,JSON_ARRAY('Proteção de vidros'))");
function check(bool $condition, string $message): void { if (!$condition) throw new RuntimeException($message); }
$client = ApoliceRepository::getAllApolices(1, false);
check(count($client) === 1 && (int)$client[0]['id'] === 7, 'Client scope');
check($client[0]['coberturas'] === [], 'Apólice antiga sem coberturas');
check($client[0]['numeroApolice'] === 'AP-OWN' && $client[0]['bemDescricao'] === 'Bem de teste', 'List contains navigation fields');
$staff = ApoliceRepository::getAllApolices(1, true);
check(count($staff) === 1 && (int)$staff[0]['id'] === 8, 'Staff scope does not mix coincident IDs');
check($staff[0]['coberturas'] === [['codigo' => null, 'descricao' => 'Proteção de vidros']], 'Descrições importadas');
$own = ApoliceRepository::getApoliceByNumero('AP-OWN',1,false);
check(is_array($own) && $own['bem']['tipo'] === 'VEICULO' && (int)$own['quantidadeParcelas'] === 12, 'Own details');
check(ApoliceRepository::getApoliceByNumero('AP-OTHER',1,false) === false, 'Other client denied');
check(ApoliceRepository::getApoliceByNumero('AP-OWN',1,true) === false, 'Other staff denied');
check(is_array(ApoliceRepository::getApoliceByNumero('AP-OTHER',1,true)), 'Own staff details');
$request = new Request(); $request->setUser((object)['sub'=>1,'roles'=>['user']]);
ob_start(); (new ApoliceController())->Show($request,new Response(),['AP-OTHER']); $body=json_decode(ob_get_clean(),true);
check(http_response_code() === 404 && isset($body['error']), 'HTTP detail ownership');
$request->setUser((object)['sub'=>1,'roles'=>['unknown']]);
ob_start(); (new ApoliceController())->Show($request,new Response(),['AP-OWN']); ob_end_clean();
check(http_response_code() === 403, 'Unsupported role denied');
echo "OK: policy list, detail ownership, role scope and response fields. Temporary tables only.\n";
