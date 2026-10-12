-- ============================================================
--  MoneyMind — Script de base de datos
--  Motor objetivo: MySQL 8.x / MariaDB 10.x (InnoDB, utf8mb4)
-- ============================================================

CREATE DATABASE IF NOT EXISTS moneymind
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE moneymind;

-- ------------------------------------------------------------
-- 1. USUARIOS
-- ------------------------------------------------------------
CREATE TABLE usuarios (
  id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100)        NOT NULL,
  email           VARCHAR(150)        NOT NULL,
  password_hash   VARCHAR(255)        NOT NULL,
  moneda          VARCHAR(3)          NOT NULL DEFAULT 'MXN',
  fecha_registro  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_usuarios_email UNIQUE (email)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 2. CATEGORIAS
--    id_usuario es NULL para categorías predefinidas (globales)
-- ------------------------------------------------------------
CREATE TABLE categorias (
  id_categoria    INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(60)         NOT NULL,
  tipo            ENUM('gasto','ingreso') NOT NULL DEFAULT 'gasto',
  icono           VARCHAR(40)         NOT NULL DEFAULT 'tag',
  color_hex       VARCHAR(7)          NOT NULL DEFAULT '#10B981',
  es_predefinida  BOOLEAN             NOT NULL DEFAULT FALSE,
  id_usuario      INT                 NULL,
  CONSTRAINT fk_categorias_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 3. GASTOS
--    categoria_sugerida_ia conserva lo que el modelo de IA propuso,
--    aunque el usuario corrija id_categoria manualmente
-- ------------------------------------------------------------
CREATE TABLE gastos (
  id_gasto              INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario            INT              NOT NULL,
  id_categoria          INT              NOT NULL,
  monto                 DECIMAL(10,2)    NOT NULL,
  descripcion           VARCHAR(200)     NOT NULL,
  fecha_gasto           DATE             NOT NULL,
  categoria_sugerida_ia INT              NULL,
  confianza_ia          DECIMAL(4,3)     NULL,
  fue_corregido         BOOLEAN          NOT NULL DEFAULT FALSE,
  creado_en             DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_gastos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_gastos_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
    ON DELETE RESTRICT,
  CONSTRAINT fk_gastos_categoria_ia
    FOREIGN KEY (categoria_sugerida_ia) REFERENCES categorias(id_categoria)
    ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX idx_gastos_usuario_fecha ON gastos(id_usuario, fecha_gasto);
CREATE INDEX idx_gastos_categoria ON gastos(id_categoria);

-- ------------------------------------------------------------
-- 4. PRESUPUESTOS (límites por categoría)
-- ------------------------------------------------------------
CREATE TABLE presupuestos (
  id_presupuesto  INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario      INT              NOT NULL,
  id_categoria    INT              NOT NULL,
  monto_limite    DECIMAL(10,2)    NOT NULL,
  periodo         ENUM('semanal','mensual') NOT NULL DEFAULT 'mensual',
  fecha_inicio    DATE             NOT NULL,
  activo          BOOLEAN          NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_presupuestos_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_presupuestos_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias(id_categoria)
    ON DELETE CASCADE,
  CONSTRAINT uq_presupuesto_usuario_categoria UNIQUE (id_usuario, id_categoria, periodo)
) ENGINE=InnoDB;

-- ------------------------------------------------------------
-- 5. ALERTAS
-- ------------------------------------------------------------
CREATE TABLE alertas (
  id_alerta        INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario       INT              NOT NULL,
  id_presupuesto   INT              NULL,
  tipo             ENUM('limite_cercano','limite_superado','resumen_mensual') NOT NULL,
  mensaje          VARCHAR(200)     NOT NULL,
  leida            BOOLEAN          NOT NULL DEFAULT FALSE,
  fecha_creacion   DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_alertas_usuario
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
    ON DELETE CASCADE,
  CONSTRAINT fk_alertas_presupuesto
    FOREIGN KEY (id_presupuesto) REFERENCES presupuestos(id_presupuesto)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_alertas_usuario_leida ON alertas(id_usuario, leida);

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

-- ============================================================
--  Datos semilla: categorías predefinidas (globales, id_usuario NULL)
--  Colores alineados a la paleta de marca MoneyMind:
--  #10B981 primario · #16324F secundario · #6750E8 acento IA · #C6F135 acento
-- ============================================================
INSERT INTO categorias (nombre, tipo, icono, color_hex, es_predefinida, id_usuario) VALUES
  ('Comida',        'gasto', 'burger',      '#10B981', TRUE, NULL),
  ('Transporte',     'gasto', 'car',         '#16324F', TRUE, NULL),
  ('Entretenimiento','gasto', 'movie',       '#6750E8', TRUE, NULL),
  ('Salud',          'gasto', 'heart',       '#C6F135', TRUE, NULL),
  ('Hogar',          'gasto', 'home',        '#16324F', TRUE, NULL),
  ('Educación',      'gasto', 'book',        '#6750E8', TRUE, NULL),
  ('Ropa',           'gasto', 'shirt',       '#C6F135', TRUE, NULL),
  ('Otros',          'gasto', 'tag',         '#5B6B7A', TRUE, NULL),
  ('Sueldo',         'ingreso','wallet',     '#10B981', TRUE, NULL);

