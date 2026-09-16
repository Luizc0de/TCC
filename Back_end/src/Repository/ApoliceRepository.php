<?php

namespace App\Repository;

use App\Models\Apolice;
use App\Models\Bem;

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

    public static function save(Apolice $apolice, Bem $bem)
    {
        try {
            $db = self::getConnection();
            $db->beginTransaction();
            // Executa a inserção da bem
            $insert_1 = $db->prepare(
                'INSERT INTO bem 
                (tipo_bem, descricao)
                VALUES
                (:tipo_bem, :descricao)'
            );

            $insert_1->execute([
                ':tipo_bem' => $bem->getTipoBem(),
                ':descricao' => $bem->getDescricao(),
            ]);
            

            $idBem = $db->lastInsertId();

            
            
            
            
            
            // Executa a inserção da apólice no banco de dados
            $insert_2 = $db->prepare(
                'INSERT INTO apolice
                (numeroApolice, dataAssinatura, dataVencimento, status, tipoApolice,
                 valorTotal, quantidadeParcelas, idCliente, idFuncionario, id_bem)
                VALUES
                (:numeroApolice, :dataAssinatura, :dataVencimento, :status, :tipoApolice,
                 :valorTotal, :quantidadeParcelas, :idCliente, :idFuncionario, :id_bem)'
            );
            
            $insert_2->execute([
                ':numeroApolice' => $apolice->getNumeroApolice(),
                ':dataAssinatura' => $apolice->getDataAssinatura(),
                ':dataVencimento' => $apolice->getDataVencimento(),
                ':status' => $apolice->getStatus(),
                ':tipoApolice' => $apolice->getTipoApolice(),
                ':valorTotal' => $apolice->getValorTotal(),
                ':quantidadeParcelas' => $apolice->getQuantidadeParcelas(),
                ':idCliente' => $apolice->getIdCliente(),
                ':idFuncionario' => $apolice->getIdFuncionario(),
                ':id_bem' => $idBem,
            ]);
            $db->commit();

            
        } catch (\PDOException $e) {
            if ($db !== null && $db->inTransaction()) {
                $db->rollBack();
            }
            throw new \Exception('Erro ao criar apólice: ' . $e->getMessage(), 500);
        }
    }
}