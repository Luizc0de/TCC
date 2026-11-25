<?php

namespace App\Services;

use App\Repository\ApoliceRepository;
use App\Repository\ParcelaRepository;
use App\Utils\StripeControl;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Invoice;
use Stripe\Webhook;

class ParcelaService
{
    public static function getAllParcelas(?int $idCliente, ?int $idApolice = null): array
    {
        return ParcelaRepository::getAllParcelas($idCliente, $idApolice);
    }

    public static function getParcelaById(int $idParcela, ?int $idCliente): array
    {
        $parcela = ParcelaRepository::getParcelaById($idParcela, $idCliente);
        if ($parcela === null) {
            throw new \DomainException('Parcela não encontrada.', 404);
        }

        return $parcela;
    }

    public static function pagar(int $idParcela, ?int $idCliente): array
    {
        $parcela = self::getParcelaById($idParcela, $idCliente);
        self::validarPagamento($parcela);

        // Retoma a emissão se a criação da fatura falhou ao cadastrar a apólice.
        if ($parcela['status'] === 'PENDENTE' || empty($parcela['stripeInvoiceId'])) {
            $falhas = StripeControl::emitirParcelasApolice(
                ApoliceRepository::getConnection(),
                (int) $parcela['idApolice'],
                (int) $parcela['idCliente'],
                $idParcela
            );
            if ($falhas !== []) {
                throw new \DomainException('Não foi possível emitir a cobrança da parcela. Tente novamente.', 502);
            }
        }

        $parcela = self::atualizarPagamento($idParcela, $idCliente);
        self::validarPagamento($parcela);
        if (empty($parcela['linkPagamento'])) {
            throw new \DomainException('O link de pagamento ainda não está disponível.', 502);
        }

        return [
            'message' => 'Acesse o link para pagar a parcela.',
            'linkPagamento' => $parcela['linkPagamento'],
            'parcela' => $parcela,
        ];
    }

    public static function atualizarPagamento(int $idParcela, ?int $idCliente): array
    {
        $parcela = self::getParcelaById($idParcela, $idCliente);
        if (in_array($parcela['status'], ['PAGA', 'CANCELADA'], true)) {
            return $parcela;
        }
        if (empty($parcela['stripeInvoiceId'])) {
            throw new \DomainException('A parcela ainda não possui uma cobrança no Stripe.', 409);
        }

        StripeControl::init();
        $invoice = Invoice::retrieve($parcela['stripeInvoiceId']);
        StripeControl::registrarFatura(ApoliceRepository::getConnection(), $parcela, $invoice);

        return self::getParcelaById($idParcela, $idCliente);
    }

    public static function receberEventoStripe(string $payload, string $assinatura): void
    {
        $secret = $_ENV['STRIPE_WEBHOOK_SECRET'] ?? '';
        if ($secret === '') {
            throw new \DomainException('Webhook de pagamento não configurado.', 500);
        }
        try {
            $evento = Webhook::constructEvent($payload, $assinatura, $secret);
        } catch (SignatureVerificationException | \UnexpectedValueException $e) {
            throw new \DomainException('Notificação do Stripe inválida.', 400);
        }
        if (!is_string($evento->type) || $evento->type === '') {
            throw new \DomainException('Notificação do Stripe inválida.', 400);
        }
        if (!in_array($evento->type, ['invoice.paid', 'invoice.payment_succeeded'], true)) {
            return;
        }
        $invoice = $evento->data->object;
        if (!$invoice instanceof Invoice || !is_string($invoice->id) || $invoice->id === '') {
            throw new \DomainException('A notificação não contém uma fatura válida.', 400);
        }
        if ($invoice->status !== 'paid') {
            return;
        }
        $parcela = ParcelaRepository::getParcelaByStripeInvoice($invoice->id);
        if ($parcela !== null) {
            StripeControl::registrarFatura(ApoliceRepository::getConnection(), $parcela, $invoice);
        }
    }

    private static function validarPagamento(array $parcela): void
    {
        if ($parcela['status'] === 'PAGA') {
            throw new \DomainException('Esta parcela já está paga.', 409);
        }
        if ($parcela['status'] === 'CANCELADA'
            || in_array($parcela['statusApolice'], ['CANCELADA', 'ENCERRADA'], true)) {
            throw new \DomainException('Não é possível pagar uma parcela ou apólice cancelada ou encerrada.', 409);
        }
    }
}
