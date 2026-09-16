<?php

namespace App\Services;

use App\Models\Apolice;
use App\Models\Bem;
use App\Repository\ApoliceRepository;
use App\Utils\Response;

class ApoliceService
{
    public static function createApolice(array $fields): void
    {
        try {
            $apolice = new Apolice(
                numeroApolice: "AP-" . uniqid(10),
                dataAssinatura: $fields['dataAssinatura'],
                dataVencimento: $fields['dataVencimento'],
                status: $fields['status'],
                tipoApolice: $fields['tipoApolice'],
                valorTotal: $fields['valorTotal'],
                quantidadeParcelas: $fields['quantidadeParcelas'] === null ? null : (int) $fields['quantidadeParcelas'],
                idCliente: (int) $fields['idCliente'],
                idFuncionario: $fields['idFuncionario']
            );
            $bem = new Bem(
                $fields['tipoBem'],
                $fields['finalidade'],
                $fields['descricao'],
                $fields['valorAvaliacao'],
                $fields['areaConstruida'] === null ? null : (int) $fields['areaConstruida'],
                $fields['tipoImovel'],
                $fields['inscricaoImobiliaria'],
                $fields['placa'],
                $fields['chassi'],
                $fields['marca'],
                $fields['modeloVeiculo'],
                $fields['dataFabricacao'],
                $fields['numeroSerie'],
                $fields['modelo'],
                $fields['tipoMaquinario'],
                $fields['tipoEletronico'],
                $fields['nomeSegurado'],
                $fields['cpf']
            );

            ApoliceRepository::save($apolice, $bem);
            Response::json(['message' => 'Apolice criada com sucesso.'], 201);
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 500;
            Response::json(['error' => $e->getMessage()], $status);
        }
    }
    public static function getAllApolices()
    {
        $aplices = ApoliceRepository::getAllApolices();
        Response::json($aplices, 200);
    }
}