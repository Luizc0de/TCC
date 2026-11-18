<?php

namespace App\Controllers;

use App\Services\ApoliceService;
use App\Utils\Request;
use App\Utils\Response;

class ApoliceController
{
    public function createApolice(Request $request): void
    {
        $body = Request::getBody();
        try {
            $fields = Request::validate([
                'tipoApolice' => $body['tipoApolice'] ?? '',
                'idCliente' => $body['idCliente'] ?? '',
                'valorTotal' => $body['valorTotal'] ?? '',
                'quantidadeParcelas' => $body['quantidadeParcelas'] ?? '',
                'diaVencimento' => $body['diaVencimento'] ?? '',
            ]);
            $bem = $body['bem'] ?? null;
            $tipos = ['VEICULO' => ['VEICULO'], 'NOTEBOOK' => ['NOTEBOOK'], 'ELETRONICO' => ['TELEFONE', 'NOTEBOOK']];
            $tipo = $bem['tipo'] ?? null;
            if (!is_string($fields['tipoApolice']) || !in_array($tipo, $tipos[$fields['tipoApolice']] ?? [], true)) {
                throw new \DomainException('O tipo de bem deve corresponder ao tipo de apólice.');
            }
            $fields['tipoBem'] = $tipo;
            $fields['valorTotal'] = $this->decimal($fields['valorTotal'], 10);
            $fields['idCliente'] = $this->inteiro($fields['idCliente'], 'idCliente');
            $fields['quantidadeParcelas'] = $this->inteiro($fields['quantidadeParcelas'], 'quantidadeParcelas');
            $fields['diaVencimento'] = $this->inteiro($fields['diaVencimento'], 'diaVencimento', 1, 21);
            $fields['dataAssinatura'] = $this->data($body['dataEmissao'] ?? null);
            $fields['dataVencimento'] = $this->data($body['dataVencimento'] ?? null);
            if ($fields['dataAssinatura'] && $fields['dataVencimento'] && $fields['dataAssinatura'] > $fields['dataVencimento']) {
                throw new \DomainException('O vencimento deve ser igual ou posterior à assinatura.');
            }
            $fields['FirstParcelNow'] = filter_var($body['FirstParcelNow'] ?? false, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($fields['FirstParcelNow'] === null) {
                throw new \DomainException('Informe um valor booleano para FirstParcelNow.');
            }
            $fields['daysfromfirstparcel'] = $fields['FirstParcelNow'] ? 0 : $this->inteiro($body['daysfromfirstparcel'] ?? null, 'daysfromfirstparcel', 0);
            $fields['idFuncionario'] = (int) $request->user()->sub;
            $fields['valorAvaliacao'] = isset($bem['valorAvaliacao']) ? $this->decimal($bem['valorAvaliacao'], 13) : null;
            $fields['dataFabricacao'] = $this->data($bem['dataFabricacao'] ?? null);
            $limites = ['finalidade' => 50, 'descricao' => 65535, 'marca' => 100, 'placa' => 10,
                'chassi' => 30, 'modeloVeiculo' => 100, 'modelo' => 100, 'numeroSerie' => 100, 'imei' => 50];
            foreach ($limites as $campo => $limite) {
                $valor = $bem[$campo] ?? null;
                if ($valor !== null && (!is_string($valor) || mb_strlen($valor) > $limite)) {
                    throw new \DomainException("Valor inválido para o campo ($campo).");
                }
                $fields[$campo] = $valor === null ? null : trim($valor);
            }
            Request::validate(['finalidade' => $fields['finalidade'], 'descricao' => $fields['descricao']]);
        } catch (\Exception $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        ApoliceService::createApolice($fields);
    }

    private function inteiro($valor, string $campo, int $min = 1, int $max = 2147483647): int
    {
        $numero = filter_var($valor, FILTER_VALIDATE_INT, ['options' => ['min_range' => $min, 'max_range' => $max]]);
        if (is_bool($valor) || $numero === false) {
            throw new \DomainException("Número inválido para o campo ($campo).");
        }
        return $numero;
    }

    private function decimal($valor, int $digitos): string
    {
        if (!is_numeric($valor) && !is_string($valor)) {
            throw new \DomainException('Informe um valor monetário válido.');
        }
        $valor = str_replace(',', '.', (string) $valor);
        if (!preg_match('/^\d{1,' . $digitos . '}(\.\d{1,2})?$/D', $valor)) {
            throw new \DomainException('Informe um valor monetário válido.');
        }
        return $valor;
    }

    private function data($valor): ?string
    {
        if ($valor === null || $valor === '') {
            return null;
        }
        if (!is_string($valor) || !preg_match('/^([1-9]\d{3})-(\d{2})-(\d{2})$/D', $valor, $partes)
            || !checkdate((int) $partes[2], (int) $partes[3], (int) $partes[1])) {
            throw new \DomainException('Informe uma data válida no formato AAAA-MM-DD.');
        }
        return $valor;
    }

    public function emAnalise(): void
    {
        ApoliceService::emAnalise();
    }

    public function analisar(Request $request, Response $response, array $params): void
    {
        $status = Request::getBody()['status'] ?? null;
        try {
            $id = $this->inteiro($params[0] ?? null, 'idApolice');
            if (!in_array($status, ['APROVADA', 'RECUSADA'], true)) {
                throw new \DomainException('Selecione APROVADA ou RECUSADA.');
            }
        } catch (\DomainException $e) {
            Response::json(['error' => $e->getMessage()], 400);
            return;
        }
        ApoliceService::analisar($id, $status);
    }
    public function Index(Request $request): void
    {
        $user = $request->user();
        $idUsuario = filter_var($user->sub ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($idUsuario === false) {
            Response::json(['error' => 'Usuário não autenticado.'], 401);
            return;
        }

        $roles = (array) ($user->roles ?? []);
        $funcionario = array_intersect(['funcionario', 'admin'], $roles) !== [];
        if (!$funcionario && !in_array('user', $roles, true)) {
            Response::json(['error' => 'Perfil sem permissão para listar apólices.'], 403);
            return;
        }

        ApoliceService::getAllApolices($idUsuario, $funcionario);
    }
    public function Show(Request $request, Response $response, array $params): void
    {
        $user = $request->user();
        $idUsuario = filter_var($user->sub ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($idUsuario === false) {
            Response::json(['error' => 'Usuário não autenticado.'], 401);
            return;
        }
        $roles = (array) ($user->roles ?? []);
        $funcionario = array_intersect(['funcionario', 'admin'], $roles) !== [];
        if (!$funcionario && !in_array('user', $roles, true)) {
            Response::json(['error' => 'Perfil sem permissão para consultar apólices.'], 403);
            return;
        }
        ApoliceService::getApoliceByNumero((string) ($params[0] ?? ''), $idUsuario, $funcionario);
    }
    
}
