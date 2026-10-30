<?php
    namespace App\Utils;

    use PDO;
    use Stripe\Stripe;
    use Stripe\Customer;
    use Stripe\Invoice;
    use Stripe\InvoiceItem;
    use Stripe\Exception\ApiErrorException;

    class StripeControl
    {
        public static function init(): void
        {
            Stripe::setApiKey($_ENV['Stripe_API_KEY']);
        }

        // Retorna o Customer do Stripe do cliente, criando e salvando o id na primeira vez
        public static function obterOuCriarCliente(PDO $pdo, int $idCliente): string
        {
            self::init();

            $stmt = $pdo->prepare(
                'SELECT name, email, cpf, stripeCustomerId FROM cliente WHERE idCliente = ?'
            );
            $stmt->execute([$idCliente]);
            $cliente = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cliente) {
                throw new \RuntimeException('Cliente não encontrado.');
            }

            if (!empty($cliente['stripeCustomerId'])) {
                return $cliente['stripeCustomerId'];
            }

            $customer = Customer::create([
                'name' => $cliente['name'],
                'email' => $cliente['email'],
                'metadata' => [
                    'idCliente' => (string) $idCliente,
                    'cpf' => $cliente['cpf']
                ]
            ], [
                'idempotency_key' => "cliente-{$idCliente}-customer-v1"
            ]);

            $pdo->prepare('UPDATE cliente SET stripeCustomerId = ? WHERE idCliente = ?')
                ->execute([$customer->id, $idCliente]);

            return $customer->id;
        }

        // Gera no Stripe as invoices das parcelas PENDENTE da apólice.
        // Uma falha em uma parcela não interrompe as demais; ela segue PENDENTE para reprocessamento.
        public static function emitirParcelasApolice(
            PDO $pdo,
            int $idApolice,
            int $idCliente,
            ?int $idParcela = null
        ): array {
            $customerId = self::obterOuCriarCliente($pdo, $idCliente);

            $total = $pdo->prepare('SELECT COUNT(*) FROM parcela WHERE idApolice = ?');
            $total->execute([$idApolice]);
            $quantidade = (int) $total->fetchColumn();

            $sqlPendentes =
                "SELECT * FROM parcela
                WHERE idApolice = ? AND status = 'PENDENTE'";
            $paramsPendentes = [$idApolice];
            if ($idParcela !== null) {
                $sqlPendentes .= ' AND idParcela = ?';
                $paramsPendentes[] = $idParcela;
            }
            $pendentes = $pdo->prepare($sqlPendentes . ' ORDER BY numeroParcela');
            $pendentes->execute($paramsPendentes);

            $salvarInvoice = $pdo->prepare(
                'UPDATE parcela SET stripeInvoiceId = ? WHERE idParcela = ?'
            );
            $salvarItem = $pdo->prepare(
                'UPDATE parcela SET itemCriado = 1 WHERE idParcela = ?'
            );
            $finalizar = $pdo->prepare(
                "UPDATE parcela SET status = ?, linkPagamento = ? WHERE idParcela = ?
                AND status IN ('PENDENTE', 'ABERTA')"
            );

            $falhas = [];

            foreach ($pendentes->fetchAll(PDO::FETCH_ASSOC) as $parcela) {
                $numero = (int) $parcela['numeroParcela'];
                $idParcela = (int) $parcela['idParcela'];
                $chave = "apolice-{$idApolice}-parcela-{$numero}-v1";

                try {
                    if ($parcela['stripeInvoiceId']) {
                        $invoice = Invoice::retrieve($parcela['stripeInvoiceId']);

                        // Rascunhos criados antes com Pix/boleto fixos: volta aos métodos habilitados na conta
                        if ($invoice->status === 'draft') {
                            $invoice = Invoice::update($invoice->id, [
                                'payment_settings' => ['payment_method_types' => '']
                            ]);
                        }
                    } else {
                        $timestamp = (new \DateTimeImmutable(
                            $parcela['dataVencimento'],
                            new \DateTimeZone('America/Sao_Paulo')
                        ))->setTime(23, 59, 59)->getTimestamp();

                        if ($timestamp <= time()) {
                            throw new \RuntimeException('O vencimento deve estar no futuro.');
                        }

                        // Sem payment_method_types, o Stripe usa os métodos habilitados no Dashboard
                        $invoice = Invoice::create([
                            'customer' => $customerId,
                            'collection_method' => 'send_invoice',
                            'currency' => 'brl',
                            'auto_advance' => false,
                            'due_date' => $timestamp,
                            'pending_invoice_items_behavior' => 'exclude',
                            'metadata' => [
                                'apoliceId' => (string) $idApolice,
                                'numeroParcela' => (string) $numero
                            ]
                        ], [
                            'idempotency_key' => $chave . '-invoice'
                        ]);

                        $salvarInvoice->execute([$invoice->id, $idParcela]);
                    }

                    if ($invoice->status === 'draft') {
                        if (!(bool) $parcela['itemCriado']) {
                            InvoiceItem::create([
                                'customer' => $customerId,
                                'invoice' => $invoice->id,
                                'amount' => (int) $parcela['valorCentavos'],
                                'currency' => 'brl',
                                'description' => "Parcela {$numero}/{$quantidade} - Apólice #{$idApolice}"
                            ], [
                                'idempotency_key' => $chave . '-item'
                            ]);

                            $salvarItem->execute([$idParcela]);
                        }

                        $invoice = $invoice->finalizeInvoice([], [
                            'idempotency_key' => $chave . '-finalize'
                        ]);
                    }

                    if (!in_array($invoice->status, ['open', 'paid'], true)) {
                        throw new \RuntimeException('Estado inesperado da invoice: ' . $invoice->status);
                    }

                    $finalizar->execute([
                        $invoice->status === 'paid' ? 'PAGA' : 'ABERTA',
                        $invoice->hosted_invoice_url,
                        $idParcela
                    ]);
                } catch (\Throwable $e) {
                    $falhas[] = "Parcela {$numero}: " . $e->getMessage();
                }
            }

            return $falhas;
        }

        public static function Createparcelas_M(
            PDO $pdo,
            int $apoliceId,
            int $parcelasquanti,
            int $daysFromFirstParcel,
            int $valorParcela,
            int $diaVencimento,
            string $stripeCustomerId
        ): array {

            self::init();

            if (
                $apoliceId <= 0 ||
                $parcelasquanti < 1 ||
                $daysFromFirstParcel < 0 ||
                $valorParcela <= 0 ||
                $diaVencimento < 1 ||
                $diaVencimento > 31 ||
                trim($stripeCustomerId) === ''
            ) {
                throw new \InvalidArgumentException(
                    'Parâmetros inválidos'
                );
            }

            $fuso = new \DateTimeZone('America/Sao_Paulo');
            $hoje = new \DateTimeImmutable('today', $fuso);

            $primeiroVencimento = $hoje->modify(
                "+{$daysFromFirstParcel} days"
            );

            $inserir = $pdo->prepare("
                INSERT INTO parcela (
                    idApolice,
                    numeroParcela,
                    valorCentavos,
                    dataVencimento,
                    status
                ) VALUES (?, ?, ?, ?, 'PENDENTE')
                ON DUPLICATE KEY UPDATE idParcela = idParcela
            ");

            $buscar = $pdo->prepare("
                SELECT *
                FROM parcela
                WHERE idApolice = ?
                AND numeroParcela = ?
            ");

            $salvarInvoice = $pdo->prepare("
                UPDATE parcela
                SET stripeInvoiceId = ?
                WHERE idApolice = ? AND numeroParcela = ?
            ");

            $salvarItem = $pdo->prepare("
                UPDATE parcela
                SET itemCriado = 1
                WHERE idApolice = ? AND numeroParcela = ?
            ");

            $finalizarRegistro = $pdo->prepare("
                UPDATE parcela
                SET status = ?, linkPagamento = ?
                WHERE idApolice = ? AND numeroParcela = ?
                AND status IN ('PENDENTE', 'ABERTA')
            ");

            $parcelas = [];

            for ($i = 1; $i <= $parcelasquanti; $i++) {

                if ($i === 1) {
                    $vencimento = $primeiroVencimento;
                } else {
                    $mes = $primeiroVencimento
                        ->modify('first day of next month')
                        ->modify('+' . ($i - 2) . ' months');

                    $dia = min(
                        $diaVencimento,
                        (int) $mes->format('t')
                    );

                    $vencimento = $mes->setDate(
                        (int) $mes->format('Y'),
                        (int) $mes->format('m'),
                        $dia
                    );
                }

                $data = $vencimento->format('Y-m-d');
                $timestamp = $vencimento
                    ->setTime(23, 59, 59)
                    ->getTimestamp();

                try {
                    // Registra a parcela antes de chamar o Stripe
                    $inserir->execute([
                        $apoliceId,
                        $i,
                        $valorParcela,
                        $data
                    ]);

                    $buscar->execute([$apoliceId, $i]);
                    $registro = $buscar->fetch(PDO::FETCH_ASSOC);

                    if (!$registro) {
                        throw new \RuntimeException(
                            'Não foi possível localizar a parcela.'
                        );
                    }

                    // Evita alterar valores em uma repetição
                    if (
                        (int) $registro['valorCentavos'] !== $valorParcela ||
                        $registro['dataVencimento'] !== $data
                    ) {
                        throw new \RuntimeException(
                            'Parcela existente com dados diferentes.'
                        );
                    }

                    $chave = "apolice-{$apoliceId}-parcela-{$i}-v1";

                    // 1. Criar ou recuperar invoice
                    if ($registro['stripeInvoiceId']) {

                        $invoice = Invoice::retrieve(
                            $registro['stripeInvoiceId']
                        );

                    } else {

                        if ($timestamp <= time()) {
                            throw new \RuntimeException(
                                'O vencimento deve estar no futuro.'
                            );
                        }

                        $invoice = Invoice::create([
                            'customer' => $stripeCustomerId,
                            'collection_method' => 'send_invoice',
                            'currency' => 'brl',
                            'auto_advance' => false,
                            'due_date' => $timestamp,
                            'pending_invoice_items_behavior' => 'exclude',
                            'payment_settings' => [
                                'payment_method_types' => [
                                    'pix',
                                    'boleto'
                                ]
                            ],
                            'metadata' => [
                                'apoliceId' => (string) $apoliceId,
                                'numeroParcela' => (string) $i
                            ]
                        ], [
                            'idempotency_key' => $chave . '-invoice'
                        ]);

                        $salvarInvoice->execute([
                            $invoice->id,
                            $apoliceId,
                            $i
                        ]);
                    }

                    // 2. Adicionar item e finalizar invoice
                    if ($invoice->status === 'draft') {

                        if (!(bool) $registro['itemCriado']) {

                            InvoiceItem::create([
                                'customer' => $stripeCustomerId,
                                'invoice' => $invoice->id,
                                'amount' => $valorParcela,
                                'currency' => 'brl',
                                'description' =>
                                    "Parcela {$i}/{$parcelasquanti}"
                                    . " - Apólice #{$apoliceId}"
                            ], [
                                'idempotency_key' => $chave . '-item'
                            ]);

                            $salvarItem->execute([
                                $apoliceId,
                                $i
                            ]);
                        }

                        $invoice = $invoice->finalizeInvoice(
                            [],
                            [
                                'idempotency_key' =>
                                    $chave . '-finalize'
                            ]
                        );
                    }

                    if (!in_array(
                        $invoice->status,
                        ['open', 'paid'],
                        true
                    )) {
                        throw new \RuntimeException(
                            'Estado inesperado da invoice: '
                            . $invoice->status
                        );
                    }

                    // 3. Persistir resultado no MySQL
                    $status = $invoice->status === 'paid'
                        ? 'PAGA'
                        : 'ABERTA';

                    $finalizarRegistro->execute([
                        $status,
                        $invoice->hosted_invoice_url,
                        $apoliceId,
                        $i
                    ]);

                    $parcelas[] = [
                        'idApolice' => $apoliceId,
                        'numeroParcela' => $i,
                        'valorCentavos' => $valorParcela,
                        'dataVencimento' => $data,
                        'status' => $status,
                        'stripeInvoiceId' => $invoice->id,
                        'linkPagamento' =>
                            $invoice->hosted_invoice_url
                    ];

                } catch (\Throwable $e) {
                    throw new \RuntimeException(
                        "Erro na parcela {$i}: " . $e->getMessage(),
                        0,
                        $e
                    );
                }
            }

            return $parcelas;
        }
}
