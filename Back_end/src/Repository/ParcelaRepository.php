<?php

namespace App\Repository;

class ParcelaRepository
{
    private const SELECT = 'SELECT p.idParcela, p.idApolice, p.numeroParcela,
        p.valorCentavos, p.dataVencimento, p.status, p.stripeInvoiceId, p.linkPagamento,
        a.numeroApolice, a.idCliente, a.status AS statusApolice
        FROM parcela p INNER JOIN apolice a ON a.idApolice = p.idApolice
        AND a.status NOT IN (\'EM_ANALISE\', \'RECUSADA\')';

    public static function getAllParcelas(?int $idCliente, ?int $idApolice = null): array
    {
        $sql = self::SELECT . ' WHERE 1 = 1';
        $params = [];

        if ($idCliente !== null) {
            $sql .= ' AND a.idCliente = :idCliente';
            $params[':idCliente'] = $idCliente;
        }
        if ($idApolice !== null) {
            $sql .= ' AND p.idApolice = :idApolice';
            $params[':idApolice'] = $idApolice;
        }

        $db = ApoliceRepository::getConnection();
        $filtros = array_filter(['idCliente' => $idCliente, 'idApolice' => $idApolice], fn ($id) => $id !== null);
        ApoliceRepository::atualizarSituacaoFinanceira($db, $filtros);
        $stmt = $db->prepare(
            $sql . ' ORDER BY p.dataVencimento, p.idApolice, p.numeroParcela'
        );
        $stmt->execute($params);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public static function getParcelaById(int $idParcela, ?int $idCliente): ?array
    {
        $sql = self::SELECT . ' WHERE p.idParcela = :idParcela';
        $params = [':idParcela' => $idParcela];
        if ($idCliente !== null) {
            $sql .= ' AND a.idCliente = :idCliente';
            $params[':idCliente'] = $idCliente;
        }

        $db = ApoliceRepository::getConnection();
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $parcela = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$parcela) {
            return null;
        }
        ApoliceRepository::atualizarSituacaoFinanceira($db, ['idApolice' => $parcela['idApolice']]);
        $stmt->execute($params);
        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public static function getParcelaByStripeInvoice(string $invoiceId): ?array
    {
        $stmt = ApoliceRepository::getConnection()->prepare(
            'SELECT idParcela, valorCentavos, status FROM parcela WHERE stripeInvoiceId = :invoiceId'
        );
        $stmt->execute([':invoiceId' => $invoiceId]);

        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public static function atualizarPagamento(int $idParcela, string $invoiceId, string $status, ?string $link,
        ?\PDO $db = null, ?int $valorCentavos = null): bool
    {
        $db ??= ApoliceRepository::getConnection();
        $filtro = 'idParcela = ? AND stripeInvoiceId = ?';
        $params = [$idParcela, $invoiceId];
        if ($valorCentavos !== null) {
            $filtro .= ' AND valorCentavos = ?';
            $params[] = $valorCentavos;
        }
        $propria = !$db->inTransaction();
        if ($propria) {
            $db->beginTransaction();
        } else {
            $db->exec('SAVEPOINT atualizar_pagamento');
        }
        try {
            // Serializa pagamentos de parcelas diferentes da mesma apólice antes de calcular o saldo em atraso.
            $lock = $db->prepare("SELECT idApolice FROM apolice WHERE idApolice =
                (SELECT idApolice FROM parcela WHERE {$filtro}) FOR UPDATE");
            $lock->execute($params);
            $idApolice = $lock->fetchColumn();
            $alterada = false;
            if ($idApolice !== false) {
                $campoLink = $status === 'PAGA' ? 'COALESCE(?, linkPagamento)' : '?';
                $stmt = $db->prepare("UPDATE parcela SET status = ?, linkPagamento = {$campoLink}
                    WHERE {$filtro} AND status IN ('PENDENTE', 'ABERTA')");
                $stmt->execute(array_merge([$status, $link], $params));
                $situacoes = ApoliceRepository::atualizarSituacaoFinanceira($db, ['idApolice' => $idApolice]);
                $alterada = $stmt->rowCount() > 0 || $situacoes > 0;
            }
            if ($propria) {
                $db->commit();
            } else {
                $db->exec('RELEASE SAVEPOINT atualizar_pagamento');
            }
            return $alterada;
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                if ($propria) {
                    $db->rollBack();
                } else {
                    $db->exec('ROLLBACK TO SAVEPOINT atualizar_pagamento');
                }
            }
            throw $e;
        }
    }

    public static function confirmarPagamentoStripe(int $idParcela, string $invoiceId, int $valorCentavos, ?string $link): bool
    {
        return self::atualizarPagamento($idParcela, $invoiceId, 'PAGA', $link, null, $valorCentavos);
    }
}
