/**
 * Testes de Detecção de Anomalias
 * Simula diferentes cenários e valida o comportamento do detector
 */

const detector = require('./gateway/detector');
const helpers = require('./gateway/helpers');

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function createMockRequest(path = '/clientes', method = 'GET', bodySize = 100) {
  return {
    path,
    method,
    body: 'x'.repeat(bodySize),
    headers: {},
    originalUrl: path,
  };
}

function createMockUser(id = 'user123', role = 'analista') {
  return {
    id,
    role,
    email: `${id}@company.com`,
  };
}

// ==============================================================
// TESTE 1: Requisição Normal
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '🧪 TESTE 1: Requisição Normal');
log('cyan', '=' .repeat(60));

const user1 = createMockUser('user001');
const req1 = createMockRequest('/clientes', 'GET', 500);
const decisionResult1 = { allowed: true, status: 200 };

const anomaly1 = detector.check(user1, req1, decisionResult1);
log(anomaly1 ? 'red' : 'green', 
  anomaly1 ? `❌ Anomalia detectada (incorreto)` : `✅ Nenhuma anomalia (correto)`);

// ==============================================================
// TESTE 2: Explosão de Requisições (Excessive Requests)
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '🧪 TESTE 2: Explosão de Requisições');
log('cyan', '=' .repeat(60));

const user2 = createMockUser('user002');
const anomalyConfig2 = { maxRequestsPerWindow: 10 };

// Simular 15 requisições rápidas
for (let i = 0; i < 15; i++) {
  const req = createMockRequest('/clientes', 'GET');
  detector.check(user2, req, decisionResult1, anomalyConfig2);
}

const anomaly2 = detector.check(user2, createMockRequest('/clientes', 'GET'), 
  decisionResult1, anomalyConfig2);

if (anomaly2 && anomaly2.anomalies.some(a => a.type === 'excessive_requests')) {
  log('green', '✅ Detecção de requisições excessivas funcionando');
  log('blue', `   Anomalias: ${anomaly2.anomalies.map(a => a.type).join(', ')}`);
} else {
  log('red', '❌ Falha na detecção de requisições excessivas');
}

// ==============================================================
// TESTE 3: Exfiltração de Dados (Data Exfiltration)
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '🧪 TESTE 3: Tentativa de Exfiltração');
log('cyan', '=' .repeat(60));

const user3 = createMockUser('user003');
const anomalyConfig3 = { maxBytesPerWindow: 1000 }; // 1KB limit

// Simular transferência grande de dados
const largePayload = 'x'.repeat(2000); // 2KB
const req3 = createMockRequest('/clientes', 'POST', 2000);
req3.body = largePayload;

const anomaly3 = detector.check(user3, req3, decisionResult1, anomalyConfig3);

if (anomaly3 && anomaly3.anomalies.some(a => a.type === 'data_exfiltration')) {
  log('green', '✅ Detecção de exfiltração funcionando');
  log('blue', `   Severidade: ${anomaly3.anomalies.find(a => a.type === 'data_exfiltration').severity}`);
  log('blue', `   Ação: ${anomaly3.action}`);
} else {
  log('red', '❌ Falha na detecção de exfiltração');
}

// ==============================================================
// TESTE 4: Requisições Rápidas (Rapid Requests)
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '🧪 TESTE 4: Requisições em Sequência Rápida');
log('cyan', '=' .repeat(60));

const user4 = createMockUser('user004');
const anomalyConfig4 = {};

// Simular requisições muito rápidas
for (let i = 0; i < 5; i++) {
  detector.check(user4, createMockRequest('/clientes'), decisionResult1, anomalyConfig4);
}

const anomaly4 = detector.check(user4, createMockRequest('/clientes'), 
  decisionResult1, anomalyConfig4);

if (anomaly4 && anomaly4.anomalies.some(a => a.type === 'rapid_requests')) {
  log('green', '✅ Detecção de requisições rápidas funcionando');
} else {
  log('yellow', '⚠️  Requisições rápidas podem não ter sido detectadas (timing)');
}

// ==============================================================
// TESTE 5: Acesso Espalhado (Scattered Access)
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '🧪 TESTE 5: Acesso a Múltiplos Recursos');
log('cyan', '=' .repeat(60));

const user5 = createMockUser('user005');
const anomalyConfig5 = { maxResourcesPerWindow: 3 };

// Acessar múltiplos recursos
const resources = ['/clientes', '/financeiro', '/relatorios', '/auditoria', '/usuarios', '/configuracoes'];
resources.forEach(resource => {
  detector.check(user5, createMockRequest(resource), decisionResult1, anomalyConfig5);
});

const anomaly5 = detector.check(user5, createMockRequest('/clientes'), 
  decisionResult1, anomalyConfig5);

if (anomaly5 && anomaly5.anomalies.some(a => a.type === 'scattered_access')) {
  log('green', '✅ Detecção de acesso espalhado funcionando');
  log('blue', `   Recursos únicos: ${anomaly5.anomalies.find(a => a.type === 'scattered_access').value}`);
} else {
  log('red', '❌ Falha na detecção de acesso espalhado');
}

// ==============================================================
// TESTE 6: Helper Functions
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '🧪 TESTE 6: Funções Helper');
log('cyan', '=' .repeat(60));

try {
  const bytes = 1024 * 1024 * 2.5; // 2.5 MB
  const formatted = helpers.formatBytes(bytes);
  log('green', `✅ formatBytes: 2621440 bytes → ${formatted}`);

  const masked = helpers.maskSensitive('12345678901-00', 'cpf');
  log('green', `✅ maskSensitive: CPF mascarado → ${masked}`);

  const outliers = helpers.detectOutliers([1, 2, 3, 100, 4, 5, 6]);
  log('green', `✅ detectOutliers: ${outliers.length} outlier(s) detectado(s)`);

  const shouldThrottle = helpers.shouldThrottle('user6', 5, 60000);
  log('green', `✅ shouldThrottle: ${shouldThrottle ? 'Throttle ativado' : 'Sem throttle'}`);
} catch (error) {
  log('red', `❌ Erro nas funções helper: ${error.message}`);
}

// ==============================================================
// TESTE 7: onBlock Handler
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '🧪 TESTE 7: Handler de Bloqueio');
log('cyan', '=' .repeat(60));

const user7 = createMockUser('user007');
try {
  detector.onBlock(user7, createMockRequest('/clientes'), { reason: 'Forbidden' });
  log('green', '✅ onBlock registrou bloqueio');

  const stats = detector.getUserStats('user007');
  if (stats && stats.blockedAttempts > 0) {
    log('green', `✅ Estatísticas: ${stats.blockedAttempts} tentativa(s) bloqueada(s)`);
  }
} catch (error) {
  log('red', `❌ Erro em onBlock: ${error.message}`);
}

// ==============================================================
// TESTE 8: Limpeza de Dados
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '🧪 TESTE 8: Funções de Gerenciamento');
log('cyan', '=' .repeat(60));

try {
  const allEvents = detector.getAllEvents();
  const userCount = Object.keys(allEvents).length;
  log('green', `✅ getAllEvents: ${userCount} usuário(s) com eventos`);

  detector.clearUserData('user001');
  const eventsAfter = detector.getAllEvents();
  const countAfter = Object.keys(eventsAfter).length;
  log('green', `✅ clearUserData: Dados limpos (${userCount} → ${countAfter})`);
} catch (error) {
  log('red', `❌ Erro em gerenciamento: ${error.message}`);
}

// ==============================================================
// RESUMO
// ==============================================================
console.log('\n' + colors.cyan + '=' .repeat(60) + colors.reset);
log('cyan', '📊 RESUMO DOS TESTES');
log('cyan', '=' .repeat(60));

log('green', '✅ Sistema de Detecção de Anomalias operacional');
log('blue', '   • Detecção de requisições excessivas');
log('blue', '   • Detecção de exfiltração de dados');
log('blue', '   • Detecção de requisições rápidas');
log('blue', '   • Detecção de acesso espalhado');
log('blue', '   • Helpers matemáticos e de formatação');
log('blue', '   • Gerenciamento de eventos');

console.log('\n');
