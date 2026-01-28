const auth = require('./auth');
const decision = require('./decisionengine');
const audit = require('./audit');
const detector = require('./detector');
const logStore = require('../storage/logStore');
const helpers = require('./helpers');
const proxy = require('../backend-proxy/proxy');
const fallback = require('./fallback');

async function middleware(req, res) {
  try {
    // 1. Autenticação via JWT
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.validateJWT(token);
    if (!user) {
      audit.record(null, req, { stage: 'auth_failed' });
      logStore.logEvent({
        userId: null,
        stage: 'auth_failed',
        method: req.method,
        path: req.path,
        reason: 'Invalid or missing JWT token',
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 2. Carregar regras baseadas no papel do usuário
    const rules = decision.loadRulesFor(user.role);

    // 3. Avaliar se pode acessar (Zero Trust + Menor Privilégio)
    const decisionResult = decision.evaluate(user, req, rules);
    audit.record(user, req, { stage: 'pre', decisionResult });

    if (!decisionResult.allowed) {
      audit.record(user, req, { stage: 'block', reason: decisionResult.reason });
      detector.onBlock(user, req, decisionResult);
      
      logStore.logBlockedAttempt(user.id, {
        reason: decisionResult.reason,
        method: req.method,
        path: req.path,
        resource: helpers.mapRouteToResource(req),
      });

      return res.status(403).json({ error: 'Forbidden', reason: decisionResult.reason });
    }

    // 4. Analisar comportamento (detecção de anomalia)
    // Carregar perfil de anomalia baseado no role do usuário
    const roleConfig = rules;
    const anomalyProfile = roleConfig?.anomalyProfile;
    const anomalyConfig = require('../config/rules.json').anomalyProfiles?.[anomalyProfile] || {};

    const anomaly = detector.check(user, req, decisionResult, anomalyConfig);
    
    if (anomaly) {
      audit.record(user, req, { stage: 'anomaly', anomaly });
      
      logStore.logAnomaly(user.id, {
        detected: true,
        action: anomaly.action,
        anomalies: anomaly.anomalies,
        eventCount: anomaly.eventCount,
      });

      const action = anomaly.action || 'alert';
      
      if (action === 'block') {
        logStore.logBlockedAttempt(user.id, {
          reason: 'Anomaly detected',
          anomalies: anomaly.anomalies.map(a => a.type),
          method: req.method,
          path: req.path,
        });
        return res.status(429).json({ 
          error: 'Too Many Requests', 
          message: 'Comportamento anômalo detectado',
          anomalies: anomaly.anomalies.map(a => ({
            type: a.type,
            severity: a.severity,
            message: a.message,
          }))
        });
      } else if (action === 'throttle') {
        // Rate limiting suave - registra mas permite
        console.warn(`[THROTTLE] Usuário ${user.id} em modo de throttle`);
      }
    }

    // 5. Encaminhar requisição com possível filtragem
    const backendResp = await proxy.forward(req, decisionResult.filteredPayload || req.body, user);

    // 6. Registrar resposta
    audit.record(user, req, { stage: 'post', status: backendResp.status });
    
    logStore.logEvent({
      userId: user.id,
      stage: 'post',
      method: req.method,
      path: req.path,
      status: backendResp.status,
      payloadSize: helpers.getPayloadSize(req.body),
      responseSize: helpers.getPayloadSize(backendResp.body),
    });

    return res.status(backendResp.status).send(backendResp.body);

  } catch (error) {
    audit.record(null, req, { stage: 'error', error: error.message });
    
    logStore.logEvent({
      userId: null,
      stage: 'error',
      method: req.method,
      path: req.path,
      error: error.message,
      stack: error.stack?.split('\n')[0],
    });

    return fallback.handleFailure(req, res, error);
  }
}

// Exportar funções de gerenciamento para uso via API (opcional)
function getSecurityDashboard() {
  return {
    stats: logStore.getSecurityStats(24),
    recentAnomalies: logStore.getAnomalies(1),
  };
}

module.exports = { 
  middleware,
  getSecurityDashboard,
};
