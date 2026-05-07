DROP TABLE IF EXISTS abastecimentos CASCADE;
DROP TABLE IF EXISTS manutencoes CASCADE;
DROP TABLE IF EXISTS veiculos CASCADE;
DROP TABLE IF EXISTS motoristas CASCADE;

CREATE TABLE motoristas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  telefone VARCHAR(20),
  idade INTEGER NOT NULL CHECK (idade >= 18),
  cnh VARCHAR(20) UNIQUE,
  validade_cnh DATE,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE veiculos (
  id SERIAL PRIMARY KEY,
  placa VARCHAR(10) UNIQUE NOT NULL,
  marca VARCHAR(50),
  modelo VARCHAR(100),
  categoria VARCHAR(20),
  ano INTEGER CHECK (ano >= 1900),
  km INTEGER DEFAULT 0,
  motorista_id INTEGER,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_motorista
    FOREIGN KEY (motorista_id)
    REFERENCES motoristas(id)
    ON DELETE SET NULL
);

CREATE TABLE manutencoes (
  id SERIAL PRIMARY KEY,
  veiculo_id INTEGER NOT NULL,
  data DATE NOT NULL,
  status VARCHAR(50) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_veiculo_manut
    FOREIGN KEY (veiculo_id)
    REFERENCES veiculos(id)
    ON DELETE CASCADE
);

CREATE TABLE abastecimentos (
  id SERIAL PRIMARY KEY,
  veiculo_id INTEGER NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_combustivel VARCHAR(20) DEFAULT 'Gasolina',
  posto VARCHAR(100),
  litros NUMERIC(10,2) NOT NULL CHECK (litros > 0),
  valor NUMERIC(10,2) NOT NULL CHECK (valor > 0),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_veiculo_abast
    FOREIGN KEY (veiculo_id)
    REFERENCES veiculos(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_veiculos_motorista ON veiculos(motorista_id);
CREATE INDEX idx_manutencoes_veiculo ON manutencoes(veiculo_id);
CREATE INDEX idx_abastecimentos_veiculo ON abastecimentos(veiculo_id);