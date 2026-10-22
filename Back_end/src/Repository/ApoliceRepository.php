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
            
            if ($bem->getTipoBem() ===  "VEICULO") {

                $insert_1 = $db->prepare(
                    'INSERT INTO bem (tipo_bem, finalidade, descricao, valor_avaliacao, marca, placa, chassi, modelo_veiculo, data_fabricacao)
                    VALUES (:tipo_bem, :finalidade, :descricao, :valor_avaliacao, :marca, :placa, :chassi, :modelo_veiculo, :data_fabricacao)',
                );
                
                $insert_1->execute([
                    ':tipo_bem' => $bem->getTipoBem(),
                    ':finalidade' => $bem->getFinalidade(),
                    ':descricao' => $bem->getDescricao(),
                    ':valor_avaliacao' => $bem->getValorAvaliacao(),
                    ':marca' => $bem->getMarca(),
                    ':placa' => $bem->getPlaca(),
                    ':chassi' => $bem->getChassi(),
                    ':modelo_veiculo' => $bem->getModeloVeiculo(),
                    ':data_fabricacao' => $bem->getDataFabricacao(),
                ]);
            }
            if ($bem->getTipoBem() ===  "TELEFONE") {
                $insert_1 = $db->prepare(
                    'INSERT INTO bem (tipo_bem, finalidade, descricao, valor_avaliacao, marca, modelo, numero_serie, imei)
                    VALUES (:tipo_bem, :finalidade, :descricao, :valor_avaliacao, :marca, :modelo, :numero_serie, :imei)',
                );

                $insert_1->execute([
                    ':tipo_bem' => $bem->getTipoBem(),
                    ':finalidade' => $bem->getFinalidade(),
                    ':descricao' => $bem->getDescricao(),
                    ':valor_avaliacao' => $bem->getValorAvaliacao(),
                    ':marca' => $bem->getMarca(),
                    ':modelo' => $bem->getModelo(),
                    ':numero_serie' => $bem->getNumeroSerie(),
                    ':imei' => $bem->getImei(),
                ]);
            }
            if ($bem->getTipoBem() ===  "NOTEBOOK") {

                $insert_1 = $db->prepare(
                    'INSERT INTO bem (tipo_bem, finalidade, descricao, valor_avaliacao, marca, modelo, numero_serie)
                    VALUES (:tipo_bem, :finalidade, :descricao, :valor_avaliacao, :marca, :modelo, :numero_serie)',
                );
                $insert_1->execute([
                    ':tipo_bem' => $bem->getTipoBem(),
                    ':finalidade' => $bem->getFinalidade(),
                    ':descricao' => $bem->getDescricao(),
                    ':valor_avaliacao' => $bem->getValorAvaliacao(),
                    ':marca' => $bem->getMarca(),
                    ':modelo' => $bem->getModelo(),
                    ':numero_serie' => $bem->getNumeroSerie(),
                ]);
            }

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
    public static function getAllApolices()
    {
        $db = self::getConnection();

        $stmt = $db->prepare("
            SELECT
                a.idApolice AS id,
                c.name AS cliente,
                a.tipoApolice AS tipo,
                a.valorTotal AS valor,
                a.status AS status,
                a.dataAssinatura AS data
            FROM apolice a
            LEFT JOIN cliente c ON c.idCliente = a.idCliente
        ");

        $stmt->execute();

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}