<?php

namespace App\Services;

use App\Models\Apolice;
use App\Repository\ApoliceRepository;
use App\Utils\Response;

class ApoliceService
{
    public static function createApolice(array $fields): void
    {
        try {
            $apolice = new Apolice(
                $fields['numeroApolice'],
                $fields['dataAssinatura'],
                $fields['dataVencimento'],
                $fields['status'],
                $fields['tipoApolice'],
                $fields['valorTotal'],
                $fields['quantidadeParcelas'] === null ? null : (int) $fields['quantidadeParcelas'],
                (int) $fields['idCliente'],
                $fields['idFuncionario']
            );

            ApoliceRepository::save($apolice);
            Response::json(['message' => 'Apolice criada com sucesso.'], 201);
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 500;
            Response::json(['error' => $e->getMessage()], $status);
        }
    }
}