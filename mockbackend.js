// mockBackend.js
const express = require('express');
const app = express();

app.use(express.json());

app.get('/clientes', (req, res) => {
  res.json([
    { nome: "João Silva", email: "joao@test.com", telefone: "99999-8888", cpf: "123.456.789-10" },
    { nome: "Maria Souza", email: "maria@test.com", telefone: "98888-7777", cpf: "109.876.543-21" }
  ]);
});

app.listen(3001, () => console.log('Mock Backend rodando em http://localhost:3001'));
