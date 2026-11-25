<?php

namespace App\Repository;

use App\Models\Apolice;
use App\Models\Bem;

class ApoliceRepository
{
    private static $db = null;

    public static function getConnection(): \PDO
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

    public static function atualizarSituacaoFinanceira(\PDO $db, array $filtros = []): int
    {
        $hoje = new \DateTimeImmutable('today', new \DateTimeZone('America/Sao_Paulo'));
        $params = [$hoje->format('Y-m-d')];
        $sql = "UPDATE apolice a SET status = (
            SELECT CASE
                WHEN MAX(p.status IN ('PENDENTE', 'ABERTA') AND p.dataVencimento < ?) = 1 THEN 'INADIMPLENTE'
                WHEN MAX(p.numeroParcela = 1 AND p.status = 'PAGA') = 1 THEN 'ATIVA'
                WHEN a.status = 'INADIMPLENTE' AND COUNT(*) > 0 THEN 'APROVADA'
                ELSE a.status END
            FROM parcela p WHERE p.idApolice = a.idApolice
        ) WHERE a.status IN ('APROVADA', 'ATIVA', 'INADIMPLENTE')";
        foreach ($filtros as $coluna => $valor) {
            if (!in_array($coluna, ['idApolice', 'numeroApolice', 'idCliente', 'idFuncionario'], true)) {
                throw new \InvalidArgumentException('Filtro de apólice desconhecido.');
            }
            $sql .= " AND a.{$coluna} = ?";
            $params[] = $valor;
        }
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        return $stmt->rowCount();
    }

    public static function save(Apolice $apolice, Bem $bem, array $parcelas = []): int
    {
        $db = null;
        try {
            $db = self::getConnection();
            $db->beginTransaction();
            $cliente = $db->prepare('SELECT idCliente FROM cliente WHERE idCliente = ?');
            $cliente->execute([$apolice->getIdCliente()]);
            if (!$cliente->fetchColumn()) {
                throw new \DomainException('Cliente não encontrado.', 404);
            }
            
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
            $tipoApolice = $apolice->getTipoApolice();
            if ($tipoApolice === 'NOTEBOOK') {
                // O enum anterior do XAMPP agrupava notebooks em ELETRONICO.
                $coluna = $db->query("SHOW COLUMNS FROM apolice LIKE 'tipoApolice'")->fetch(\PDO::FETCH_ASSOC);
                if (str_starts_with($coluna['Type'], 'enum(') && !str_contains($coluna['Type'], "'NOTEBOOK'")) {
                    $tipoApolice = 'ELETRONICO';
                }
            }

            // Executa a inserção da apólice no banco de dados
            $insert_2 = $db->prepare(
                'INSERT INTO apolice
                (numeroApolice, dataAssinatura, dataVencimento, status, tipoApolice, coberturas,
                 valorTotal, quantidadeParcelas, idCliente, idFuncionario, id_bem)
                VALUES
                (:numeroApolice, :dataAssinatura, :dataVencimento, :status, :tipoApolice, :coberturas,
                 :valorTotal, :quantidadeParcelas, :idCliente, :idFuncionario, :id_bem)'
            );
            
            $insert_2->execute([
                ':numeroApolice' => $apolice->getNumeroApolice(),
                ':dataAssinatura' => $apolice->getDataAssinatura(),
                ':dataVencimento' => $apolice->getDataVencimento(),
                ':status' => $apolice->getStatus(),
                ':tipoApolice' => $tipoApolice,
                ':coberturas' => json_encode($apolice->getCoberturas(), JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
                ':valorTotal' => $apolice->getValorTotal(),
                ':quantidadeParcelas' => $apolice->getQuantidadeParcelas(),
                ':idCliente' => $apolice->getIdCliente(),
                ':idFuncionario' => $apolice->getIdFuncionario(),
                ':id_bem' => $idBem,
            ]);
            $idApolice = $db->lastInsertId();

            $insertParcela = $db->prepare(
                'INSERT INTO parcela (idApolice, numeroParcela, valorCentavos, dataVencimento)
                VALUES (:idApolice, :numeroParcela, :valorCentavos, :dataVencimento)'
            );

            foreach ($parcelas as $parcela) {
                $insertParcela->execute([
                    ':idApolice' => $idApolice,
                    ':numeroParcela' => $parcela['numeroParcela'],
                    ':valorCentavos' => $parcela['valorCentavos'],
                    ':dataVencimento' => $parcela['dataVencimento'],
                ]);
            }

            $db->commit();

            return (int) $idApolice;

        } catch (\Throwable $e) {
            if ($db !== null && $db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }

    public static function emAnalise(): array
    {
        $stmt = self::getConnection()->query("
            SELECT a.idApolice AS id, a.numeroApolice, a.tipoApolice AS tipo, a.valorTotal AS valor,
                a.status, a.coberturas, a.dataAssinatura AS data, a.dataVencimento, a.quantidadeParcelas, c.name AS cliente,
                b.tipo_bem AS bemTipo, b.finalidade, b.descricao AS bemDescricao,
                b.valor_avaliacao AS valorAvaliacao, b.marca, b.modelo, b.modelo_veiculo AS modeloVeiculo,
                b.data_fabricacao AS dataFabricacao, b.placa, b.chassi, b.numero_serie AS numeroSerie, b.imei
            FROM apolice a JOIN cliente c ON c.idCliente = a.idCliente JOIN bem b ON b.id_bem = a.id_bem
            WHERE a.status = 'EM_ANALISE' ORDER BY a.idApolice
        ");
        return array_map([self::class, 'comCoberturas'], $stmt->fetchAll(\PDO::FETCH_ASSOC));
    }

    public static function decidirAnalise(int $id, string $status): int
    {
        $db = self::getConnection();
        $db->beginTransaction();
        try {
            $stmt = $db->prepare('SELECT status, idCliente FROM apolice WHERE idApolice = ? FOR UPDATE');
            $stmt->execute([$id]);
            $apolice = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (!$apolice) {
                throw new \DomainException('Apólice não encontrada.', 404);
            }
            if ($apolice['status'] !== 'EM_ANALISE') {
                throw new \DomainException('Esta apólice já saiu da fila de análise.', 409);
            }
            $db->prepare('UPDATE apolice SET status = ? WHERE idApolice = ?')->execute([$status, $id]);
            if ($status === 'RECUSADA') {
                $db->prepare("UPDATE parcela SET status = 'CANCELADA' WHERE idApolice = ? AND status = 'PENDENTE'")
                    ->execute([$id]);
            } else {
                self::atualizarSituacaoFinanceira($db, ['idApolice' => $id]);
            }
            $db->commit();
            return (int) $apolice['idCliente'];
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            throw $e;
        }
    }
    public static function getStatus(int $id): string
    {
        $stmt = self::getConnection()->prepare('SELECT status FROM apolice WHERE idApolice = ?');
        $stmt->execute([$id]);
        $status = $stmt->fetchColumn();
        if ($status === false) {
            throw new \DomainException('Apólice não encontrada.', 404);
        }
        return $status;
    }

    public static function getAllApolices(int $idUsuario, bool $funcionario): array
    {
        $db = self::getConnection();
        // Cliente e funcionário têm IDs em tabelas diferentes; filtrar apenas
        // a coluna correspondente ao perfil para não misturar IDs coincidentes.
        $colunaVinculo = $funcionario ? 'idFuncionario' : 'idCliente';
        self::atualizarSituacaoFinanceira($db, [$colunaVinculo => $idUsuario]);

        $stmt = $db->prepare("
            SELECT
                a.idApolice AS id,
                a.numeroApolice,
                a.coberturas,
                a.dataVencimento,
                a.quantidadeParcelas,
                b.descricao AS bemDescricao,
                b.tipo_bem AS bemTipo,
                b.marca AS bemMarca,
                c.name AS cliente,
                a.tipoApolice AS tipo,
                a.valorTotal AS valor,
                a.status AS status,
                a.dataAssinatura AS data
            FROM apolice a
            LEFT JOIN cliente c ON c.idCliente = a.idCliente
            LEFT JOIN bem b ON b.id_bem = a.id_bem
            WHERE a.{$colunaVinculo} = :idUsuario
        ");

        $stmt->execute([':idUsuario' => $idUsuario]);

        return array_map([self::class, 'comCoberturas'], $stmt->fetchAll(\PDO::FETCH_ASSOC));
    }
    public static function getApolice(string|int $identificador, int $idUsuario, bool $funcionario): array|false
    {
        $db = self::getConnection();
        // Um número de apólice só com dígitos continua sendo uma string. O ID interno é inteiro.
        $colunaApolice = is_int($identificador) ? 'idApolice' : 'numeroApolice';
        $colunaVinculo = $funcionario ? 'idFuncionario' : 'idCliente';
        self::atualizarSituacaoFinanceira($db, [$colunaVinculo => $idUsuario, $colunaApolice => $identificador]);

        $stmt = $db->prepare("
            SELECT
                a.idApolice AS id,
                a.numeroApolice AS numeroApolice,
                a.coberturas,
                a.dataVencimento,
                a.quantidadeParcelas,
                a.id_bem AS idBem,
                c.name AS cliente,
                a.tipoApolice AS tipo,
                a.valorTotal AS valor,
                a.status AS status,
                a.dataAssinatura AS data
            FROM apolice a
            LEFT JOIN cliente c ON c.idCliente = a.idCliente
            WHERE a.{$colunaApolice} = :identificador AND a.{$colunaVinculo} = :idUsuario
        ");

        $stmt->execute([':identificador' => $identificador, ':idUsuario' => $idUsuario]);
        $apolice = $stmt->fetch(\PDO::FETCH_ASSOC);

        if ($apolice === false) {
            return false;
        }

        $stmtBem = $db->prepare("
            SELECT
                id_bem AS id,
                tipo_bem AS tipo,
                finalidade,
                descricao,
                valor_avaliacao AS valorAvaliacao,
                marca,
                placa,
                chassi,
                modelo_veiculo AS modeloVeiculo,
                data_fabricacao AS dataFabricacao,
                modelo,
                numero_serie AS numeroSerie,
                imei
            FROM bem
            WHERE id_bem = :id_bem
        ");
        $stmtBem->execute([':id_bem' => $apolice['idBem']]);

        unset($apolice['idBem']);
        $apolice['bem'] = $stmtBem->fetch(\PDO::FETCH_ASSOC) ?: null;

        return self::comCoberturas($apolice);
    }

    private static function comCoberturas(array $apolice): array
    {
        $texto = trim($apolice['coberturas'] ?? '');
        $lista = $texto === '' ? [] : json_decode($texto);
        $apolice['coberturas'] = null;
        if (!is_array($lista)) {
            return $apolice;
        }
        $coberturas = [];
        foreach ($lista as $item) {
            // Registros anteriores também podem conter uma lista simples de descrições.
            $descricao = is_string($item) ? $item : ($item->descricao ?? null);
            $codigo = $item->codigo ?? null;
            if (!is_string($descricao) || trim($descricao) === '' || ($codigo !== null && !is_string($codigo))) {
                return $apolice;
            }
            $coberturas[] = ['codigo' => $codigo, 'descricao' => $descricao];
        }
        $apolice['coberturas'] = $coberturas;
        return $apolice;
    }
}
