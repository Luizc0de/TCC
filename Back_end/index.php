<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");


require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/src/Core/Main.php";

use App\Core\Router;
use App\Core\Routes;
use Dotenv\Dotenv;

// Carrega o .env localizado no diretório atual (__DIR__)
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();


Router::dispatch(Routes::routes());


?>
