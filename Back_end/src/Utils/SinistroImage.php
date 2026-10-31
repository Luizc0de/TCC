<?php

namespace App\Utils;

class SinistroImage
{
    public const MAX_BYTES = 5 * 1024 * 1024;
    private const TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];

    public static function salvar(array $upload): array
    {
        $erro = $upload['error'] ?? UPLOAD_ERR_NO_FILE;
        if ($erro === UPLOAD_ERR_INI_SIZE || $erro === UPLOAD_ERR_FORM_SIZE) {
            throw new \DomainException('A imagem deve ter no máximo 5 MiB.', 413);
        }
        if (in_array($erro, [UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE, UPLOAD_ERR_EXTENSION], true)) {
            throw new \RuntimeException('Falha no armazenamento do upload.');
        }
        if ($erro !== UPLOAD_ERR_OK || !is_string($upload['tmp_name'] ?? null)
            || !is_uploaded_file($upload['tmp_name'])) {
            throw new \DomainException('Envie uma imagem válida no campo imagem.', 400);
        }

        $tmp = $upload['tmp_name'];
        $tamanho = filesize($tmp);
        if ($tamanho === false || $tamanho === 0) {
            throw new \DomainException('A imagem está vazia ou inválida.', 400);
        }
        if ($tamanho > self::MAX_BYTES) {
            throw new \DomainException('A imagem deve ter no máximo 5 MiB.', 413);
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->file($tmp);
        if (!is_string($mime) || !isset(self::TYPES[$mime])) {
            throw new \DomainException('Use uma imagem JPEG, PNG ou WebP.', 415);
        }
        $info = @getimagesize($tmp);
        if ($info === false || ($info['mime'] ?? '') !== $mime || $info[0] < 1 || $info[1] < 1
            || $info[0] > 10000 || $info[1] > 10000 || $info[0] * $info[1] > 40000000) {
            throw new \DomainException('A imagem está inválida ou tem dimensões muito grandes.', 400);
        }

        $diretorio = self::diretorio();
        if (!is_dir($diretorio) && !mkdir($diretorio, 0700, true) && !is_dir($diretorio)) {
            throw new \RuntimeException('Não foi possível criar o diretório de imagens.');
        }
        $arquivo = bin2hex(random_bytes(16)) . '.' . self::TYPES[$mime];
        if (!move_uploaded_file($tmp, $diretorio . DIRECTORY_SEPARATOR . $arquivo)) {
            throw new \RuntimeException('Não foi possível salvar a imagem.');
        }

        return ['arquivo' => $arquivo, 'mime' => $mime];
    }

    public static function caminho(string $arquivo): string
    {
        if (!preg_match('/\A[a-f0-9]{32}\.(?:jpg|png|webp)\z/', $arquivo)) {
            throw new \DomainException('Imagem não encontrada.', 404);
        }

        return self::diretorio() . DIRECTORY_SEPARATOR . $arquivo;
    }

    public static function remover(string $arquivo): void
    {
        $path = self::caminho($arquivo);
        if (is_file($path) && !unlink($path)) {
            error_log('Não foi possível remover uma imagem de sinistro após falha ao salvar.');
        }
    }

    private static function diretorio(): string
    {
        $config = $_ENV['SINISTRO_STORAGE_DIR'] ?? getenv('SINISTRO_STORAGE_DIR');

        return is_string($config) && $config !== ''
            ? rtrim($config, '/\\') : dirname(__DIR__, 2) . '/storage/sinistros';
    }
}
