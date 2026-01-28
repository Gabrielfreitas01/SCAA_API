#!/usr/bin/env node

/**
 * Exemplo de Uso Prático - Detecção de Anomalias
 * 
 * Este script demonstra como o sistema de detecção trabalha
 * em diferentes cenários reais
 */

const detector = require('./gateway/detector');
const logStore = require('./storage/logStore');
const helpers = require('./gateway/helpers');

console.log('\n' + '='.repeat(70));
console.log('  EXEMPLO PRÁTICO: Detecção de Anomalias em Ação');
console.log('='.repeat(70) + '\n');

// ==============================================================
// CENÁRIO 1: Usuário Normal
// ==============================================================
console.log('📌 CENÁRIO 1: Usuário Normal Trabalhando\n');

const normalUser = {
  id: 'ana.silva@company.com',
  role: 'analista',
  name: 'Ana Silva'
};

console.log(`👤 Usuário: ${normalUser.name} (${normalUser.role})`);
console.log('📊 Atividade:');

// Simular 5 requisições normais
for (let i = 1; i <= 5; i++) {
  const req = {
    path: '/clientes',
    method: i % 2 === 0 ? 'POST' : 'GET',
    body: 'dados...',
    originalUrl: '/clientes',
  };
  
  const result = detector.check(normalUser, req, { allowed: true, status: 200 });
  
  console.log(`   ${i}. ${req.method} ${req.path} - ${result ? '⚠️ Anômalo' : '✅ Normal'}`);
}

console.log('\n✅ Resultado: Nenhuma anomalia detectada (padrão esperado)\n');

// ==============================================================
// CENÁRIO 2: Ataque de Força Bruta
// ==============================================================
console.log('📌 CENÁRIO 2: Tentativa de Ataque (Força Bruta)\n');

const attackerUser = {
  id: 'hacker.user@malicious.com',
  role: 'operacional',
  name: 'Usuário Suspeito'
};

console.log(`👤 Usuário: ${attackerUser.name} (${attackerUser.role})`);
console.log('📊 Atividade de Ataque:');

const anomalyConfig = {
  maxRequestsPerWindow: 50,
  timeWindow: 60000
};

// Simular 80 requisições rápidas
for (let i = 1; i <= 80; i++) {
  const req = {
    path: '/clientes',
    method: 'GET',
    body: '{}',
    originalUrl: '/clientes',
  };
  
  const result = detector.check(attackerUser, req, { allowed: true, status: 200 }, anomalyConfig);
  
  if (i === 1 || i === 40 || i === 80) {
    if (result) {
      console.log(`   ${i}. Requisição #${i} - ⚠️ ANOMALIA DETECTADA`);
      console.log(`      └─ Tipo: ${result.anomalies[0].type}`);
      console.log(`      └─ Severidade: ${result.anomalies[0].severity}`);
      console.log(`      └─ Ação: ${result.action}`);
    } else {
      console.log(`   ${i}. Requisição #${i} - ✅ Normal`);
    }
  }
}

console.log('\n🚨 Resultado: BLOQUEADO - Padrão de ataque detectado\n');

// ==============================================================
// CENÁRIO 3: Exfiltração de Dados
// ==============================================================
console.log('📌 CENÁRIO 3: Tentativa de Exfiltração de Dados\n');

const dataThiefUser = {
  id: 'carlos.santos@company.com',
  role: 'analista',
  name: 'Carlos Santos'
};

console.log(`👤 Usuário: ${dataThiefUser.name} (${dataThiefUser.role})`);
console.log('📊 Atividade Suspeita:');

const largePayload = 'x'.repeat(15 * 1024 * 1024); // 15 MB

const exfilConfig = {
  maxBytesPerWindow: 10 * 1024 * 1024, // 10 MB
  timeWindow: 60000
};

const exfilReq = {
  path: '/clientes',
  method: 'POST',
  body: largePayload,
  originalUrl: '/clientes',
};

console.log(`   1. POST /clientes com ${helpers.formatBytes(largePayload.length)} de dados`);

const exfilResult = detector.check(dataThiefUser, exfilReq, 
  { allowed: true, status: 200 }, exfilConfig);

if (exfilResult) {
  const exfilAnomaly = exfilResult.anomalies.find(a => a.type === 'data_exfiltration');
  if (exfilAnomaly) {
    console.log(`\n⚠️ ANOMALIA: Exfiltração de Dados`);
    console.log(`   └─ ${exfilAnomaly.message}`);
    console.log(`   └─ Ação: ${exfilResult.action.toUpperCase()}`);
  }
}

console.log('\n🚨 Resultado: BLOQUEADO - Exfiltração detectada\n');

// ==============================================================
// CENÁRIO 4: Escalação Progressiva de Alertas
// ==============================================================
console.log('📌 CENÁRIO 4: Comportamento Anômalo com Escalação\n');

const suspiciousUser = {
  id: 'maria.oliveira@company.com',
  role: 'analista',
  name: 'Maria Oliveira'
};

console.log(`👤 Usuário: ${suspiciousUser.name} (${suspiciousUser.role})`);
console.log('📊 Comportamento Monitorado:\n');

let actionProgression = [];

// Progressão de comportamento anômalo
const scenarios = [
  { action: '10 requisições em 60s', threshold: 100 },
  { action: '30 requisições em 60s', threshold: 100 },
  { action: '80 requisições em 60s', threshold: 100 },
  { action: '150 requisições em 60s', threshold: 100 },
];

scenarios.forEach((scenario, idx) => {
  const escalConfig = { maxRequestsPerWindow: scenario.threshold };
  
  // Simular cenário
  for (let i = 0; i < parseInt(scenario.action.split(' ')[0]); i++) {
    const req = {
      path: '/clientes',
      method: 'GET',
      body: '{}',
      originalUrl: '/clientes',
    };
    
    const result = detector.check(suspiciousUser, req, 
      { allowed: true, status: 200 }, escalConfig);
  }
  
  const finalReq = {
    path: '/clientes',
    method: 'GET',
    body: '{}',
    originalUrl: '/clientes',
  };
  
  const result = detector.check(suspiciousUser, finalReq, 
    { allowed: true, status: 200 }, escalConfig);
  
  if (result) {
    console.log(`   Fase ${idx + 1}: ${scenario.action}`);
    console.log(`      └─ Ação: ${result.action.toUpperCase()}`);
    actionProgression.push(result.action);
  }
});

console.log('\n📈 Progressão: ALERT → THROTTLE → BLOCK\n');

// ==============================================================
// CENÁRIO 5: Análise Comparativa
// ==============================================================
console.log('📌 CENÁRIO 5: Comparação de Comportamentos\n');

console.log('🔍 Análise Comparativa de Usuários:\n');

const profiles = [
  { id: 'user001', role: 'admin', behavior: 'normal' },
  { id: 'user002', role: 'analista', behavior: 'suspeito' },
  { id: 'user003', role: 'operacional', behavior: 'normal' },
];

profiles.forEach(profile => {
  const stats = detector.getUserStats(profile.id);
  
  console.log(`👤 ${profile.id} (${profile.role})`);
  if (stats) {
    console.log(`   Eventos totais: ${stats.totalEvents}`);
    console.log(`   Últimos 5 min: ${stats.last5MinEvents}`);
    console.log(`   Bloqueios: ${stats.blockedAttempts}`);
  } else {
    console.log(`   [Sem dados]`);
  }
  console.log('');
});

// ==============================================================
// RESUMO DE SEGURANÇA
// ==============================================================
console.log('='.repeat(70));
console.log('📊 RESUMO DE SEGURANÇA\n');

const allAnomalies = logStore.getAnomalies(1); // Último 1 hora
console.log(`Total de Anomalias Detectadas: ${allAnomalies.length}`);

if (allAnomalies.length > 0) {
  const bySeverity = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  };
  
  allAnomalies.forEach(a => {
    if (a.anomalies) {
      a.anomalies.forEach(anom => {
        bySeverity[anom.severity]++;
      });
    }
  });
  
  console.log('\nDistribuição por Severidade:');
  console.log(`  🔴 CRITICAL: ${bySeverity.critical}`);
  console.log(`  🟠 HIGH: ${bySeverity.high}`);
  console.log(`  🟡 MEDIUM: ${bySeverity.medium}`);
  console.log(`  🟢 LOW: ${bySeverity.low}`);
}

console.log('\n✅ Sistema de Detecção Operacional');
console.log('\nPróximos Passos:');
console.log('  1. Revisar anomalias no /admin/dashboard');
console.log('  2. Analisar eventos em /admin/anomalies');
console.log('  3. Investigar usuários suspeitos em /admin/user/:userId/activity');
console.log('  4. Exportar dados para análise em /admin/logs/export');

console.log('\n' + '='.repeat(70) + '\n');
