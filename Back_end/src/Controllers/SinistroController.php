<?php

namespace App\Controllers;

use App\Services\SinistroService;
use App\Utils\Request;
use App\Utils\Response;

class SinistroController
{
    public function criar(Request $request): void
    {
        $this->responder($request, function (int $idUsuario, bool $funcionario): array {
            if ($funcionario) {
                throw new \DomainException('Somente clientes podem abrir um sinistro.', 403);
            }
            if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 6 * 1024 * 1024) {
                throw new \DomainException('O envio excede o limite de tamanho permitido.', 413);
            }
            $body = Request::getBody();
            $idApolice = $this->validarId($body['idApolice'] ?? null);
            if (!is_string($body['descricao'] ?? null)) {
                throw new \DomainException('Informe a descrição do sinistro.', 400);
            }

            return SinistroService::criar(
                $idUsuario,
                $idApolice,
                $body['descricao'],
                is_array($_FILES['imagem'] ?? null) ? $_FILES['imagem'] : []
            );
        }, 201);
    }

    public function Index(Request $request): void
    {
        $this->responder($request, function (int $idUsuario, bool $funcionario): array {
            $idApolice = isset($_GET['idApolice']) ? $this->validarId($_GET['idApolice']) : null;

            return SinistroService::getAll($idUsuario, $funcionario, $idApolice);
        });
    }

    public function Show(Request $request, Response $response, array $params): void
    {
        $this->responder($request, fn (int $idUsuario, bool $funcionario): array =>
            SinistroService::getById($this->validarId($params[0] ?? null), $idUsuario, $funcionario)
        );
    }

    public function imagem(Request $request, Response $response, array $params): void
    {
        try {
            [$idUsuario, $funcionario] = $this->usuario($request);
            $imagem = SinistroService::getImagem($this->validarId($params[0] ?? null), $idUsuario, $funcionario);
            header('Content-Type: ' . $imagem['mime']);
            header('Content-Length: ' . filesize($imagem['path']));
            header('Cache-Control: private, no-store');
            header('X-Content-Type-Options: nosniff');
            readfile($imagem['path']);
        } catch (\Throwable $e) {
            $this->erro($e);
        }
    }

    private function validarId($valor): int
    {
        $id = filter_var($valor, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id === false) {
            throw new \DomainException('Informe um identificador inteiro maior que zero.', 400);
        }

        return $id;
    }

    private function usuario(Request $request): array
    {
        $user = $request->user();
        $id = filter_var($user->sub ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
        if ($id === false) {
            throw new \DomainException('Usuário não autenticado.', 401);
        }
        $roles = (array) ($user->roles ?? []);
        $funcionario = array_intersect(['funcionario', 'admin'], $roles) !== [];
        if (!$funcionario && !in_array('user', $roles, true)) {
            throw new \DomainException('Perfil sem permissão para acessar sinistros.', 403);
        }

        return [$id, $funcionario];
    }

    private function responder(Request $request, callable $acao, int $status = 200): void
    {
        try {
            [$id, $funcionario] = $this->usuario($request);
            Response::json($acao($id, $funcionario), $status);
        } catch (\Throwable $e) {
            $this->erro($e);
        }
    }

    private function erro(\Throwable $e): void
    {
        if ($e instanceof \DomainException) {
            Response::json(['error' => $e->getMessage()], $e->getCode());
            return;
        }
        error_log('Falha ao processar sinistro: ' . get_class($e));
        Response::json(['error' => 'Não foi possível processar o sinistro.'], 500);
    }
}
