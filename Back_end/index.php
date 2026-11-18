<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}


require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/src/Core/Main.php";

use App\Core\Router;
use App\Core\Routes;
use Dotenv\Dotenv;

try {
    Dotenv::createImmutable(__DIR__)->load();
    Router::dispatch(Routes::routes());
} catch (\Throwable $e) {
    error_log('Falha na API: ' . get_class($e));
    \App\Utils\Response::json(['error' => 'Não foi possível processar a solicitação.'], 500);
}


?>
