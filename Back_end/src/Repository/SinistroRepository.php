<?php

namespace App\Repository;

class SinistroRepository
{
    private const SELECT = 'SELECT s.idSinistro, s.idApolice, s.descricao,
        s.imagemArquivo, s.imagemMime, s.status, s.dataAbertura,
        a.numeroApolice, a.idCliente, a.idFuncionario
        FROM sinistro s INNER JOIN apolice a ON a.idApolice = s.idApolice';

    public static function getAll(int $idUsuario, bool $funcionario, ?int $idApolice = null): array
    {
        $coluna = $funcionario ? 'a.idFuncionario' : 'a.idCliente';
        $sql = self::SELECT . " WHERE {$coluna} = :idUsuario";
        $params = [':idUsuario' => $idUsuario];
        if ($idApolice !== null) {
            $sql .= ' AND s.idApolice = :idApolice';
            $params[':idApolice'] = $idApolice;
        }

        $stmt = ApoliceRepository::getConnection()->prepare($sql . ' ORDER BY s.dataAbertura DESC, s.idSinistro DESC');
        $stmt->execute($params);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    public static function getById(int $idSinistro, int $idUsuario, bool $funcionario): ?array
    {
        $coluna = $funcionario ? 'a.idFuncionario' : 'a.idCliente';
        $stmt = ApoliceRepository::getConnection()->prepare(
            self::SELECT . " WHERE s.idSinistro = :idSinistro AND {$coluna} = :idUsuario"
        );
        $stmt->execute([':idSinistro' => $idSinistro, ':idUsuario' => $idUsuario]);

        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public static function getApoliceDoCliente(int $idApolice, int $idCliente): ?array
    {
        // A abertura mantém a apólice bloqueada até salvar a imagem e o registro.
        $stmt = ApoliceRepository::getConnection()->prepare(
            'SELECT idApolice FROM apolice WHERE idApolice = :idApolice AND idCliente = :idCliente FOR UPDATE'
        );
        $stmt->execute([':idApolice' => $idApolice, ':idCliente' => $idCliente]);

        return $stmt->fetch(\PDO::FETCH_ASSOC) ?: null;
    }

    public static function save(int $idApolice, string $descricao, array $imagem): int
    {
        $db = ApoliceRepository::getConnection();
        $stmt = $db->prepare(
            'INSERT INTO sinistro (idApolice, descricao, imagemArquivo, imagemMime)
            VALUES (:idApolice, :descricao, :arquivo, :mime)'
        );
        $stmt->execute([
            ':idApolice' => $idApolice,
            ':descricao' => $descricao,
            ':arquivo' => $imagem['arquivo'],
            ':mime' => $imagem['mime'],
        ]);

        return (int) $db->lastInsertId();
    }
}
