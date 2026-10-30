<?php

namespace App\Repository;

class ParcelaRepository
{
    private const SELECT = 'SELECT p.idParcela, p.idApolice, p.numeroParcela,
        p.valorCentavos, p.dataVencimento, p.status, p.stripeInvoiceId, p.linkPagamento,
        a.numeroApolice, a.idCliente, a.status AS statusApolice
        FROM parcela p INNER JOIN apolice a ON a.idApolice = p.idApolice';

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

        $stmt = ApoliceRepository::getConnection()->prepare(
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

        $stmt = ApoliceRepository::getConnection()->prepare($sql);
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

    public static function confirmarPagamentoStripe(int $idParcela, string $invoiceId, int $valorCentavos, ?string $link): bool
    {
        // Atualização atômica: reenvios do mesmo evento ou de outra confirmação
        // da mesma fatura não dão baixa novamente. Não há outros efeitos colaterais.
        $stmt = ApoliceRepository::getConnection()->prepare(
            "UPDATE parcela SET status = 'PAGA', linkPagamento = COALESCE(:link, linkPagamento)
            WHERE idParcela = :idParcela AND stripeInvoiceId = :invoiceId
            AND valorCentavos = :valorCentavos AND status <> 'PAGA'"
        );
        $stmt->execute([
            ':link' => $link,
            ':idParcela' => $idParcela,
            ':invoiceId' => $invoiceId,
            ':valorCentavos' => $valorCentavos,
        ]);

        return $stmt->rowCount() > 0;
    }

    public static function atualizarPagamento(int $idParcela, string $invoiceId, string $status, ?string $link): void
    {
        // Uma consulta atrasada não deve reabrir uma parcela já paga ou cancelada.
        $stmt = ApoliceRepository::getConnection()->prepare(
            "UPDATE parcela SET status = :status, linkPagamento = :link
            WHERE idParcela = :idParcela AND stripeInvoiceId = :invoiceId
            AND status IN ('PENDENTE', 'ABERTA')"
        );
        $stmt->execute([
            ':status' => $status,
            ':link' => $link,
            ':idParcela' => $idParcela,
            ':invoiceId' => $invoiceId,
        ]);
    }
}
