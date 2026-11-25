<?php

namespace App\Controllers;

use App\Services\ParcelaService;
use App\Utils\Response;

class StripeWebhookController
{
    public function receber(): void
    {
        try {
            ParcelaService::receberEventoStripe(file_get_contents('php://input'), $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');
            Response::json(['recebido' => true], 200);
        } catch (\DomainException $e) {
            Response::json(['error' => $e->getMessage()], $e->getCode());
        }
    }
}
