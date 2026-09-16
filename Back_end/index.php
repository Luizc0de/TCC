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

// Carrega o .env localizado no diretório atual (__DIR__)
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();

// asdasd
Router::dispatch(Routes::routes());


?>
