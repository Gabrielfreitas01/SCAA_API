const helpers = require('./helpers');

// Armazenamento em memória de eventos por usuário
// Estrutura: { userId: { events: [...], lastCleanup: timestamp } }
const userEvents = new Map();

// Configuração padrão de detecção
const defaultConfig = {
  timeWindow: 60000, // 1 minuto em ms
  maxRequestsPerWindow: 100,
  maxBytesPerWindow: 10485760, // 10 MB
  cooldownPeriod: 300000, // 5 minutos
  anomalyThreshold: 1.5, // 50% acima da média histórica
};

/**
 * Registra um evento para análise
 */
function recordEvent(userId, req, decisionResult) {
  if (!userEvents.has(userId)) {
    userEvents.set(userId, { events: [], lastCleanup: Date.now() });
  }

  const userRecord = userEvents.get(userId);
  const payload = req.body || {};
  const payloadSize = JSON.stringify(payload).length;

  userRecord.events.push({
    timestamp: Date.now(),
    method: req.method,
    path: req.path,
    resource: req.path.split('/')[1],
    payloadSize,
    statusCode: decisionResult?.status || 200,
  });

  // Limpeza periódica de eventos antigos
  cleanupOldEvents(userId, defaultConfig.timeWindow);
}

/**
 * Remove eventos fora da janela de tempo
 */
function cleanupOldEvents(userId, timeWindow) {
  const userRecord = userEvents.get(userId);
  if (!userRecord) return;

  const now = Date.now();
  const cutoff = now - timeWindow;

  userRecord.events = userRecord.events.filter(event => event.timestamp > cutoff);
  userRecord.lastCleanup = now;
}

/**
 * Detecta anomalias no comportamento do usuário
 */
function check(user, req, decisionResult, anomalyConfig = {}) {
  if (!user || !user.id) return null;

  const config = { ...defaultConfig, ...anomalyConfig };
  recordEvent(user.id, req, decisionResult);

  const userRecord = userEvents.get(user.id);
  if (!userRecord || userRecord.events.length === 0) return null;

  const now = Date.now();
  const recentEvents = userRecord.events.filter(
    e => e.timestamp > now - config.timeWindow
  );

  // Validações de anomalia
  const anomalies = [];

  // 1. Volume de requisições
  if (recentEvents.length > config.maxRequestsPerWindow) {
    anomalies.push({
      type: 'excessive_requests',
      severity: 'high',
      value: recentEvents.length,
      threshold: config.maxRequestsPerWindow,
      message: `Usuário excedeu limite: ${recentEvents.length}/${config.maxRequestsPerWindow} requisições`,
    });
  }

  // 2. Volume de dados transferidos
  const totalBytes = recentEvents.reduce((sum, e) => sum + e.payloadSize, 0);
  if (totalBytes > config.maxBytesPerWindow) {
    anomalies.push({
      type: 'data_exfiltration',
      severity: 'critical',
      value: totalBytes,
      threshold: config.maxBytesPerWindow,
      message: `Volume de dados suspeito: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
    });
  }

  // 3. Padrão de requisições rápidas
  if (recentEvents.length >= 3) {
    const intervals = [];
    for (let i = 1; i < recentEvents.length; i++) {
      intervals.push(recentEvents[i].timestamp - recentEvents[i - 1].timestamp);
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    if (avgInterval < 100) { // Menos de 100ms entre requisições
      anomalies.push({
        type: 'rapid_requests',
        severity: 'high',
        value: avgInterval,
        threshold: 100,
        message: `Requisições em sequência rápida: ${avgInterval.toFixed(0)}ms entre elas`,
      });
    }
  }

  // 4. Acesso a múltiplos recursos em janela curta
  const uniqueResources = new Set(recentEvents.map(e => e.resource)).size;
  if (uniqueResources > 5) {
    anomalies.push({
      type: 'scattered_access',
      severity: 'medium',
      value: uniqueResources,
      threshold: 5,
      message: `Acesso a muitos recursos diferentes: ${uniqueResources} recursos`,
    });
  }

  // 5. Mudança de padrão de acesso
  if (recentEvents.length > 10) {
    const readCount = recentEvents.filter(e => e.method === 'GET').length;
    const writeCount = recentEvents.filter(e => e.method === 'POST').length;
    const readRatio = readCount / recentEvents.length;

    // Se usuário muda drasticamente seu padrão (era 90% read, agora 50% write)
    if (readRatio < 0.3) {
      anomalies.push({
        type: 'behavior_change',
        severity: 'medium',
        value: readRatio,
        threshold: 0.3,
        message: `Mudança de padrão: ${(readRatio * 100).toFixed(0)}% de requisições são leitura (esperado: 70%+)`,
      });
    }
  }

  if (anomalies.length === 0) return null;

  // Determinar ação baseada na severidade
  let action = 'alert';
  const hasCritical = anomalies.some(a => a.severity === 'critical');
  const highCount = anomalies.filter(a => a.severity === 'high').length;

  if (hasCritical || highCount >= 2) {
    action = 'block';
  } else if (highCount >= 1) {
    action = 'throttle';
  }

  return {
    detected: true,
    action,
    anomalies,
    userId: user.id,
    timestamp: now,
    eventCount: recentEvents.length,
  };
}

/**
 * Registra bloqueios para análise posterior
 */
function onBlock(user, req, decisionResult) {
  if (!user || !user.id) return;

  const userRecord = userEvents.get(user.id);
  if (!userRecord) {
    userEvents.set(user.id, { events: [], lastCleanup: Date.now() });
  }

  // Incrementar contador de bloqueios
  const record = userEvents.get(user.id);
  if (!record.blockedAttempts) {
    record.blockedAttempts = [];
  }

  record.blockedAttempts.push({
    timestamp: Date.now(),
    reason: decisionResult.reason,
    method: req.method,
    path: req.path,
  });

  // Se múltiplos bloqueios em pouco tempo, é suspeito
  const recentBlocks = record.blockedAttempts.filter(
    b => b.timestamp > Date.now() - 60000 // Últimos 60s
  );

  if (recentBlocks.length > 5) {
    console.warn(`[SECURITY] Usuário ${user.id} teve ${recentBlocks.length} tentativas bloqueadas em 60s`);
  }
}

/**
 * Retorna estatísticas de um usuário
 */
function getUserStats(userId) {
  const userRecord = userEvents.get(userId);
  if (!userRecord) return null;

  const now = Date.now();
  const last5MinEvents = userRecord.events.filter(
    e => e.timestamp > now - 300000
  );

  return {
    totalEvents: userRecord.events.length,
    last5MinEvents: last5MinEvents.length,
    lastActivity: userRecord.events[userRecord.events.length - 1]?.timestamp,
    blockedAttempts: userRecord.blockedAttempts?.length || 0,
  };
}

/**
 * Limpa dados de um usuário (útil para testes)
 */
function clearUserData(userId) {
  userEvents.delete(userId);
}

/**
 * Retorna todos os eventos registrados (para análise)
 */
function getAllEvents() {
  const allEvents = {};
  userEvents.forEach((record, userId) => {
    allEvents[userId] = record.events;
  });
  return allEvents;
}

module.exports = { 
  check, 
  onBlock, 
  recordEvent,
  getUserStats,
  clearUserData,
  getAllEvents,
};
