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

        $firstParcelNow = filter_var($body['FirstParcelNow'] ?? false, FILTER_VALIDATE_BOOLEAN);

        try {
            $fields_apolice = Request::validate([
                // Required fieldS apólice
                'status' => $body['status'] ?? '',
                'tipoApolice' => $body['tipoApolice'] ?? '',
                'idCliente' => $body['idCliente'] ?? '',
                'valorTotal' => $body['valorTotal'] ?? '',
                'quantidadeParcelas' => $body['quantidadeParcelas'] ?? '',
                'diaVencimento' => $body['diaVencimento'] ?? '',
            ]);

            $dia = filter_var($fields_apolice['diaVencimento'], FILTER_VALIDATE_INT);
            if ($dia === false || $dia < 1 || $dia > 21) {
                throw new \Exception('O campo (diaVencimento) deve ser um dia entre 1 e 21.');
            }
            $fields_apolice['diaVencimento'] = $dia;

            $fields_bem = Request::validate([
                // Required fields bem
                'tipoBem' => $bem['tipo'] ?? '',
                'finalidade' => $bem['finalidade'] ?? '',
                'descricao' => $bem['descricao'] ?? '',
            ]);

            // Parâmetros das parcelas: sem pagar a primeira agora, é preciso informar o prazo
            if (!$firstParcelNow) {
                Request::validate([
                    'daysfromfirstparcel' => $body['daysfromfirstparcel'] ?? '',
                ]);
            }
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        // Optional fields apólice
        $fields_apolice['dataAssinatura'] = $body['dataEmissao'] ?? null;
        $fields_apolice['dataVencimento'] = $body['dataVencimento'] ?? null;
        $fields_apolice['FirstParcelNow'] = $firstParcelNow;
        $fields_apolice['daysfromfirstparcel'] = $body['daysfromfirstparcel'] ?? null;

        $fields_apolice['idFuncionario'] = (int) $request->user()->sub;
        

        // Optional fields bem
        $fields_bem['valorAvaliacao'] = $bem['valorAvaliacao'] ?? null;
        $fields_bem['placa'] = $bem['placa'] ?? null;
        $fields_bem['chassi'] = $bem['chassi'] ?? null;
        $fields_bem['marca'] = $bem['marca'] ?? null;
        $fields_bem['modeloVeiculo'] = $bem['modeloVeiculo'] ?? null;
        $fields_bem['dataFabricacao'] = $bem['dataFabricacao'] ?? null;
        $fields_bem['numeroSerie'] = $bem['numeroSerie'] ?? null;
        $fields_bem['modelo'] = $bem['modelo'] ?? null;
        $fields_bem['imei'] = $bem['imei'] ?? null;

        ApoliceService::createApolice(array_merge($fields_apolice, $fields_bem));
    }
    public function Index()
    {
        return ApoliceService::getAllApolices();
        
    }
    public function Show(Request $request, Response $response, array $params): void
    {
        ApoliceService::getApoliceByNumero($params[0]);
    }
    
}