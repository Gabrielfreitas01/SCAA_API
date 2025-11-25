require('dotenv').config();

const express = require('express');
const gateway = require('./gateway/index.js');

const app = express();
app.use(express.json());

app.use(gateway.middleware);

app.get('/', (req, res) => res.send('SCAA ativo'));

app.listen(3000, () => console.log('SCAA rodando na porta 3000'));
