<?php

namespace App\Services;

use App\Models\Apolice;
use App\Models\Bem;
use App\Repository\ApoliceRepository;
use App\Utils\Response;
use App\Utils\StripeControl;

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
                tipoBem: $fields['tipoBem'],
                finalidade: $fields['finalidade'],
                descricao: $fields['descricao'],
                valorAvaliacao: $fields['valorAvaliacao'],
                placa: $fields['placa'],
                chassi: $fields['chassi'],
                marca: $fields['marca'],
                modeloVeiculo: $fields['modeloVeiculo'],
                dataFabricacao: $fields['dataFabricacao'],
                numeroSerie: $fields['numeroSerie'],
                modelo: $fields['modelo'],
                imei: $fields['imei']
            );

            if ($fields['tipoBem'] === "VEICULO") {
                if (empty($fields['placa']) || empty($fields['chassi']) || empty($fields['marca']) || empty($fields['modeloVeiculo'])) {
                    throw new \Exception('Campos obrigatórios para veículo não preenchidos.', 400);
                }
                
            }
            else if ($fields['tipoBem'] === "TELEFONE") {
                if (empty($fields['numeroSerie'])|| empty($fields['modelo']) || empty($fields['imei'])) {
                    throw new \Exception('Campos obrigatórios para telefone não preenchidos.', 400);
                }
            }
            else{
                if (empty($fields['numeroSerie']) || empty($fields['modelo'])) {
                    throw new \Exception('Campos obrigatórios para notebook não preenchidos.', 400);
                }
            }

            $parcelas = self::gerarParcelas($fields);

            $idApolice = ApoliceRepository::save($apolice, $bem, $parcelas);

            // A apólice e as parcelas já estão salvas; falhas no Stripe não as desfazem
            $falhasStripe = [];
            if ($parcelas !== []) {
                try {
                    $falhasStripe = StripeControl::emitirParcelasApolice(
                        ApoliceRepository::getConnection(),
                        $idApolice,
                        $apolice->getIdCliente()
                    );
                } catch (\Throwable $e) {
                    $falhasStripe = [$e->getMessage()];
                }
            }

            $resposta = ['message' => 'Apolice criada com sucesso.'];
            if ($falhasStripe !== []) {
                $resposta['avisoStripe'] = 'Algumas parcelas não foram geradas no Stripe e permanecem PENDENTES.';
                $resposta['falhasStripe'] = $falhasStripe;
            }

            Response::json($resposta, 201);
        } catch (\Exception $e) {
            $status = $e->getCode() ?: 500;
            Response::json(['error' => $e->getMessage()], $status);
        }
    }
    // Divide o valor total (em centavos) em parcelas mensais; a diferença do arredondamento vai para a última
    private static function gerarParcelas(array $fields): array
    {
        if ($fields['valorTotal'] === null || $fields['valorTotal'] === '') {
            return [];
        }

        $totalCentavos = (int) round((float) str_replace(',', '.', (string) $fields['valorTotal']) * 100);
        $quantidade = max(1, (int) ($fields['quantidadeParcelas'] ?? 1));

        if ($totalCentavos < $quantidade) {
            throw new \Exception('Valor total insuficiente para a quantidade de parcelas.', 400);
        }

        $base = new \DateTimeImmutable($fields['dataAssinatura'] ?: 'today');
        $diasPrimeiraParcela = empty($fields['FirstParcelNow']) ? (int) ($fields['daysfromfirstparcel'] ?? 30) : 0;
        $primeiroVencimento = $base->modify("+{$diasPrimeiraParcela} days");

        $valorParcela = intdiv($totalCentavos, $quantidade);
        $parcelas = [];

        for ($i = 0; $i < $quantidade; $i++) {
            // A 1ª parcela vence no prazo informado; as demais no dia de vencimento escolhido dos meses seguintes
            $vencimento = $i === 0
                ? $primeiroVencimento
                : self::diaDoMes($primeiroVencimento, $i, (int) $fields['diaVencimento']);

            $parcelas[] = [
                'numeroParcela' => $i + 1,
                'valorCentavos' => $i === $quantidade - 1
                    ? $totalCentavos - $valorParcela * ($quantidade - 1)
                    : $valorParcela,
                'dataVencimento' => $vencimento->format('Y-m-d'),
            ];
        }

        return $parcelas;
    }

    // Dia fixo no mês seguinte ao da 1ª parcela + (n-1) meses, limitado ao último dia do mês
    private static function diaDoMes(\DateTimeImmutable $primeiro, int $n, int $dia): \DateTimeImmutable
    {
        $mes = $primeiro->modify('first day of this month')->modify("+{$n} months");

        return $mes->setDate(
            (int) $mes->format('Y'),
            (int) $mes->format('n'),
            min($dia, (int) $mes->format('t'))
        );
    }

    public static function getAllApolices()
    {
        $aplices = ApoliceRepository::getAllApolices();
        Response::json($aplices, 200);
    }
    public static function getApoliceByNumero($numeroApolice): void
    {
        $apolice = ApoliceRepository::getApoliceByNumero($numeroApolice);

        if ($apolice === false) {
            Response::json(['error' => 'Apólice não encontrada.'], 404);
            return;
        }

        $apolice['bem'] = self::formatBem($apolice['bem']);

        Response::json($apolice, 200);
    }

    // Mantém apenas os campos que pertencem ao tipo do bem
    private static function formatBem(?array $bem): ?array
    {
        if ($bem === null) {
            return null;
        }

        $comuns = ['id', 'tipo', 'finalidade', 'descricao', 'valorAvaliacao', 'marca'];
        $especificos = match ($bem['tipo']) {
            'VEICULO' => ['placa', 'chassi', 'modeloVeiculo', 'dataFabricacao'],
            'TELEFONE' => ['modelo', 'numeroSerie', 'imei'],
            'NOTEBOOK' => ['modelo', 'numeroSerie'],
            default => [],
        };

        return array_intersect_key($bem, array_flip(array_merge($comuns, $especificos)));
    }
}