CREATE TABLE IF NOT EXISTS recuperacao_senha (
    tipoConta ENUM('cliente','funcionario') NOT NULL,
    idConta INT NOT NULL,
    email VARCHAR(255) NOT NULL,
    codigoHash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
    tokenHash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
    expiraEm BIGINT UNSIGNED NOT NULL DEFAULT 0,
    ultimoEnvio BIGINT UNSIGNED NOT NULL DEFAULT 0,
    inicioJanela BIGINT UNSIGNED NOT NULL DEFAULT 0,
    envios TINYINT UNSIGNED NOT NULL DEFAULT 0,
    tentativas TINYINT UNSIGNED NOT NULL DEFAULT 0,
    PRIMARY KEY (tipoConta, idConta),
    UNIQUE KEY uk_recuperacao_token (tokenHash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
