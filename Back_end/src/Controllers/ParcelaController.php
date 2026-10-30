<?php

namespace App\Controllers;

use App\Services\ParcelaService;
use App\Utils\Request;
use App\Utils\Response;
use Stripe\Exception\ApiErrorException;

class ParcelaController
{
    public function Index(Request $request): void
    {
        $this->responder($request, function (?int $idCliente): array {
            $body = Request::getBody();
            $idApolice = isset($body['idApolice']) ? $this->validarId($body['idApolice']) : null;

            return ParcelaService::getAllParcelas($idCliente, $idApolice);
        });
    }

    public function Show(Request $request, Response $response, array $params): void
    {
        $this->responder($request, fn (?int $idCliente): array =>
            ParcelaService::getParcelaById($this->validarId($params[0] ?? null), $idCliente)
        );
    }

    public function Pagar(Request $request, Response $response, array $params): void
    {
        $this->responder($request, fn (?int $idCliente): array =>
            ParcelaService::pagar($this->validarId($params[0] ?? null), $idCliente)
        );
    }

    public function atualizarPagamento(Request $request, Response $response, array $params): void
    {
        $this->responder($request, fn (?int $idCliente): array =>
            ParcelaService::atualizarPagamento($this->validarId($params[0] ?? null), $idCliente)
        );
    }

    private function validarId($valor): int
    {
        $id = filter_var($valor, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id === false) {
            throw new \DomainException('Informe um identificador inteiro maior que zero.', 400);
        }

        return $id;
    }

    private function responder(Request $request, callable $acao): void
    {
        try {
            $user = $request->user();
            $id = filter_var($user->sub ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
            if ($id === false) {
                throw new \DomainException('Usuário não autenticado.', 401);
            }

            $roles = (array) ($user->roles ?? []);
            $podeVerTodas = array_intersect(['admin', 'funcionario'], $roles) !== [];
            Response::json($acao($podeVerTodas ? null : $id), 200);
        } catch (\DomainException $e) {
            Response::json(['error' => $e->getMessage()], $e->getCode());
        } catch (ApiErrorException $e) {
            Response::json(['error' => 'Não foi possível consultar o pagamento no Stripe. Tente novamente.'], 502);
        } catch (\Throwable $e) {
            Response::json(['error' => 'Não foi possível processar as parcelas.'], 500);
        }
    }
}
