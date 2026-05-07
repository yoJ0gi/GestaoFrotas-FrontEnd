const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/veiculos", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT v.*, m.nome as motorista_nome
      FROM veiculos v
      LEFT JOIN motoristas m ON v.motorista_id = m.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/veiculos", async (req, res) => {
  const { placa, marca, modelo, categoria, ano, km, motorista_id } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO veiculos (placa, marca, modelo, categoria, ano, km, motorista_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [placa, marca, modelo, categoria, ano, km, motorista_id]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/veiculos/:id", async (req, res) => {
  const { placa, marca, modelo, categoria, ano, km, motorista_id } = req.body;
  try {
    await db.query(
      "UPDATE veiculos SET placa = $1, marca = $2, modelo = $3, categoria = $4, ano = $5, km = $6, motorista_id = $7 WHERE id = $8",
      [placa, marca, modelo, categoria, ano, km, motorista_id, req.params.id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/veiculos/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM veiculos WHERE id = $1", [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/motoristas", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM motoristas");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/motoristas", async (req, res) => {
  const { nome, cpf, telefone, idade, cnh, validade_cnh, email } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO motoristas (nome, cpf, telefone, idade, cnh, validade_cnh, email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
      [nome, cpf, telefone, idade, cnh, validade_cnh, email]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/motoristas/:id", async (req, res) => {
  const { nome, cpf, telefone, idade, cnh, validade_cnh, email } = req.body;
  try {
    await db.query(
      "UPDATE motoristas SET nome = $1, cpf = $2, telefone = $3, idade = $4, cnh = $5, validade_cnh = $6, email = $7 WHERE id = $8",
      [nome, cpf, telefone, idade, cnh, validade_cnh, email, req.params.id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/motoristas/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM motoristas WHERE id = $1", [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/manutencoes", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.*, v.placa as veiculo_placa
      FROM manutencoes m
      LEFT JOIN veiculos v ON m.veiculo_id = v.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/manutencoes", async (req, res) => {
  const { veiculo_id, data, status } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO manutencoes (veiculo_id, data, status) VALUES ($1, $2, $3) RETURNING id",
      [veiculo_id, data, status]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/manutencoes/:id", async (req, res) => {
  const { veiculo_id, data, status } = req.body;
  try {
    await db.query(
      "UPDATE manutencoes SET veiculo_id = $1, data = $2, status = $3 WHERE id = $4",
      [veiculo_id, data, status, req.params.id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/manutencoes/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM manutencoes WHERE id = $1", [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/abastecimentos", async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, v.placa as veiculo_placa
      FROM abastecimentos a
      LEFT JOIN veiculos v ON a.veiculo_id = v.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/abastecimentos", async (req, res) => {
  const { veiculo_id, data, tipo_combustivel, posto, litros, valor } = req.body;
  try {
    const result = await db.query(
      "INSERT INTO abastecimentos (veiculo_id, data, tipo_combustivel, posto, litros, valor) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
      [veiculo_id, data, tipo_combustivel, posto, litros, valor]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/abastecimentos/:id", async (req, res) => {
  const { veiculo_id, data, tipo_combustivel, posto, litros, valor } = req.body;
  try {
    await db.query(
      "UPDATE abastecimentos SET veiculo_id = $1, data = $2, tipo_combustivel = $3, posto = $4, litros = $5, valor = $6 WHERE id = $7",
      [veiculo_id, data, tipo_combustivel, posto, litros, valor, req.params.id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/abastecimentos/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM abastecimentos WHERE id = $1", [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
