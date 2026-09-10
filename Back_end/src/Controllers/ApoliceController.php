<?php

namespace App\Controllers;

use App\Services\ApoliceService;
use App\Utils\Request;
use App\Utils\Response;

class ApoliceController
{
    public function createApolice(Request $request): void
    {
        $body = Request::getBody();

        try {
            $fields = Request::validate([
                'numeroApolice' => $body['numeroApolice'] ?? '',
                'status' => $body['status'] ?? '',
                'tipoApolice' => $body['tipoApolice'] ?? '',
                'idCliente' => $body['idCliente'] ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }

        $fields['dataAssinatura'] = $body['dataAssinatura'] ?? null;
        $fields['dataVencimento'] = $body['dataVencimento'] ?? null;
        $fields['valorTotal'] = $body['valorTotal'] ?? null;
        $fields['quantidadeParcelas'] = $body['quantidadeParcelas'] ?? null;
        $fields['idFuncionario'] = (int) $request->user()->sub;

        ApoliceService::createApolice($fields);
    }
}