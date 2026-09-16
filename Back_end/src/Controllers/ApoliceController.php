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
        $bem = $body['bem'] ?? [];

        try {
            $fields_apolice = Request::validate([
                // Required fieldS apólice
                'status' => $body['status'] ?? '',
                'tipoApolice' => $body['tipoApolice'] ?? '',
                'idCliente' => $body['idCliente'] ?? '',
                
            ]);
            $fields_bem = Request::validate([
                // Required fields bem
                'tipoBem' => $bem['tipo'] ?? '',
                'finalidade' => $bem['finalidade'] ?? '',
                'descricao' => $bem['descricao'] ?? '',
            ]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        // Optional fields apólice
        $fields_apolice['dataAssinatura'] = $body['dataEmissao'] ?? null;
        $fields_apolice['dataVencimento'] = $body['dataVencimento'] ?? null;
        $fields_apolice['valorTotal'] = $body['valorTotal'] ?? null;
        $fields_apolice['quantidadeParcelas'] = $body['quantidadeParcelas'] ?? null;
        $fields_apolice['idFuncionario'] = (int) $request->user()->sub;

        // Optional fields bem
    $fields_bem['valorAvaliacao'] = $bem['valorAvaliacao'] ?? null;
    $fields_bem['areaConstruida'] = $bem['areaConstruida'] ?? null;
    $fields_bem['tipoImovel'] = $bem['tipoImovel'] ?? null;
    $fields_bem['inscricaoImobiliaria'] = $bem['inscricaoImobiliaria'] ?? null;
    $fields_bem['placa'] = $bem['placa'] ?? null;
    $fields_bem['chassi'] = $bem['chassi'] ?? null;
    $fields_bem['marca'] = $bem['marca'] ?? null;
    $fields_bem['modeloVeiculo'] = $bem['modeloVeiculo'] ?? null;
    $fields_bem['dataFabricacao'] = $bem['dataFabricacao'] ?? null;
    $fields_bem['numeroSerie'] = $bem['numeroSerie'] ?? null;
    $fields_bem['modelo'] = $bem['modelo'] ?? null;
    $fields_bem['tipoMaquinario'] = $bem['tipoMaquinario'] ?? null;
    $fields_bem['tipoEletronico'] = $bem['tipoEletronico'] ?? null;
    $fields_bem['nomeSegurado'] = $bem['nomeSegurado'] ?? null;
    $fields_bem['cpf'] = $bem['cpf'] ?? null;

        ApoliceService::createApolice(array_merge($fields_apolice, $fields_bem));
    }
}