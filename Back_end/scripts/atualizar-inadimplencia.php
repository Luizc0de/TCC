<?php

use App\Repository\ApoliceRepository;
use Dotenv\Dotenv;

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
require dirname(__DIR__) . '/vendor/autoload.php';

try {
    Dotenv::createImmutable(dirname(__DIR__))->load();
    $quantidade = ApoliceRepository::atualizarSituacaoFinanceira(ApoliceRepository::getConnection());
    echo "Apólices atualizadas: {$quantidade}\n";
} catch (\Throwable $e) {
    fwrite(STDERR, "Falha ao atualizar a situação financeira das apólices.\n");
    exit(1);
}
