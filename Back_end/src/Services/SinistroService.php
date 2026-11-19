<?php

namespace App\Services;

use App\Repository\ApoliceRepository;
use App\Repository\SinistroRepository;
use App\Utils\SinistroImage;

class SinistroService
{
    public static function criar(int $idCliente, int $idApolice, string $descricao, array $upload): array
    {
        $descricao = trim($descricao);
        if ($descricao === '' || mb_strlen($descricao, 'UTF-8') > 5000) {
            throw new \DomainException('A descrição deve ter entre 1 e 5000 caracteres.', 400);
        }

        $db = ApoliceRepository::getConnection();
        $imagem = null;
        try {
            $db->beginTransaction();
            if (SinistroRepository::getApoliceDoCliente($idApolice, $idCliente) === null) {
                throw new \DomainException('Apólice não encontrada para este cliente.', 404);
            }

            $imagem = SinistroImage::salvar($upload);
            $id = SinistroRepository::save($idApolice, $descricao, $imagem);
            $sinistro = self::getById($id, $idCliente, 'cliente');
            $db->commit();

            return ['message' => 'Sinistro criado com sucesso.', 'sinistro' => $sinistro];
        } catch (\Throwable $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            if ($imagem !== null) {
                SinistroImage::remover($imagem['arquivo']);
            }
            throw $e;
        }
    }

    public static function analisar(int $idSinistro, mixed $status): array
    {
        if (!in_array($status, ['APROVADO', 'NEGADO'], true)) {
            throw new \DomainException('Selecione APROVADO ou NEGADO para a indenização.', 400);
        }
        SinistroRepository::decidir($idSinistro, $status);
        $decisao = $status === 'APROVADO' ? 'aprovada' : 'negada';
        return ['idSinistro' => $idSinistro, 'status' => $status, 'message' => "Indenização do sinistro #{$idSinistro} {$decisao}."];
    }

    public static function getAll(int $idUsuario, string $perfil, ?int $idApolice = null): array
    {
        return array_map([self::class, 'formatar'], SinistroRepository::getAll($idUsuario, $perfil, $idApolice));
    }

    public static function getById(int $idSinistro, int $idUsuario, string $perfil): array
    {
        return self::formatar(self::buscar($idSinistro, $idUsuario, $perfil));
    }

    public static function getImagem(int $idSinistro, int $idUsuario, string $perfil): array
    {
        $sinistro = self::buscar($idSinistro, $idUsuario, $perfil);
        $path = SinistroImage::caminho($sinistro['imagemArquivo'] ?? '');
        if (!is_file($path) || !is_readable($path)) {
            throw new \DomainException('Imagem não encontrada.', 404);
        }

        return ['path' => $path, 'mime' => $sinistro['imagemMime']];
    }

    private static function buscar(int $idSinistro, int $idUsuario, string $perfil): array
    {
        $sinistro = SinistroRepository::getById($idSinistro, $idUsuario, $perfil);
        if ($sinistro === null) {
            throw new \DomainException('Sinistro não encontrado.', 404);
        }

        return $sinistro;
    }

    private static function formatar(array $sinistro): array
    {
        foreach (['idSinistro', 'idApolice', 'idCliente', 'idFuncionario'] as $campo) {
            $sinistro[$campo] = $sinistro[$campo] === null ? null : (int) $sinistro[$campo];
        }
        unset($sinistro['imagemArquivo'], $sinistro['imagemMime']);
        $sinistro['imagemUrl'] = 'index.php?url=sinistros/imagem/' . $sinistro['idSinistro'];

        return $sinistro;
    }
}
