<?php

require_once __DIR__ . "/vendor/autoload.php";
require_once __DIR__ . "/src/Core/main.php";

use App\Core\Router;
use App\Core\Routes;
use Dotenv\Dotenv;

// Carrega o .env localizado no diretório atual (__DIR__)
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->load();


Router::dispatch(Routes::routes());


?>
