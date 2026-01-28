require('dotenv').config();

const express = require('express');
const gateway = require('./gateway/index.js');
const adminRoutes = require('./gateway/adminRoutes');

const app = express();
app.use(express.json());

// Rotas administrativas (sem autenticação para desenvolvimento)
app.use(adminRoutes);

// Middleware de segurança do gateway
app.use(gateway.middleware);

// Health check
app.get('/', (req, res) => res.json({ 
  status: 'SCAA ativo',
  version: '2.0',
  timestamp: new Date().toISOString()
}));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 SCAA rodando na porta ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/admin/dashboard`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/admin/health\n`);
});
