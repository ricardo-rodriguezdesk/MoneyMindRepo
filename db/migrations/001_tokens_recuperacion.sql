-- Migración 001 (HU03): agrega la tabla de tokens de recuperación.
-- Solo hace falta si la BD se creó antes de este commit; db/schema.sql ya la incluye.
USE moneymind;

-- ------------------------------------------------------------
-- 6. TOKENS_RECUPERACION (HU03: enlace para restablecer contraseña)
--    Se guarda solo el hash del token; vigencia de 30 minutos y un solo uso
-- ------------------------------------------------------------
CREATE TABLE tokens_recuperacion (
  id_token          INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario        INT              NOT NULL,
  token_hash        CHAR(64)         NOT NULL,
  fecha_creacion    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_expiracion  DATETIME         NOT NULL,
  usado             BOOLEAN          NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_tokens_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT uq_tokens_hash UNIQUE (token_hash)
) ENGINE=InnoDB;
