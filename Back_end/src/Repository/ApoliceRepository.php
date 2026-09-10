<?php

namespace App\Repository;

use App\Models\Apolice;

class ApoliceRepository
{
    private static $db = null;

    private static function getConnection(): \PDO
    {
        if (self::$db === null) {
            $dsn = sprintf(
                'mysql:host=%s;dbname=%s;charset=utf8mb4',
                $_ENV['DB_HOST'],
                $_ENV['DB_NAME']
            );

            self::$db = new \PDO($dsn, $_ENV['DB_USER'], $_ENV['DB_PASS']);
            self::$db->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        }

        return self::$db;
    }

    public static function save(Apolice $apolice): bool
    {
        try {
            $stmt = self::getConnection()->prepare(
                'INSERT INTO apolice
                (numeroApolice, dataAssinatura, dataVencimento, status, tipoApolice,
                 valorTotal, quantidadeParcelas, idCliente, idFuncionario)
                VALUES
                (:numeroApolice, :dataAssinatura, :dataVencimento, :status, :tipoApolice,
                 :valorTotal, :quantidadeParcelas, :idCliente, :idFuncionario)'
            );

            return $stmt->execute([
                ':numeroApolice' => $apolice->getNumeroApolice(),
                ':dataAssinatura' => $apolice->getDataAssinatura(),
                ':dataVencimento' => $apolice->getDataVencimento(),
                ':status' => $apolice->getStatus(),
                ':tipoApolice' => $apolice->getTipoApolice(),
                ':valorTotal' => $apolice->getValorTotal(),
                ':quantidadeParcelas' => $apolice->getQuantidadeParcelas(),
                ':idCliente' => $apolice->getIdCliente(),
                ':idFuncionario' => $apolice->getIdFuncionario(),
            ]);
        } catch (\PDOException $e) {
            throw new \Exception('Erro ao criar apólice: ' . $e->getMessage(), 500);
        }
    }
}