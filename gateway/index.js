const auth = require('./auth');
const decision = require('./decisionengine');
const audit = require('./audit');
const detector = require('./detector');
const proxy = require('../backend-proxy/proxy');
const fallback = require('./fallback');

async function middleware(req, res) {
  try {
    // 1. Autenticação via JWT
    const token = req.headers.authorization?.replace('Bearer ', '');
    const user = auth.validateJWT(token);
    if (!user) {
      audit.record(null, req, { stage: 'auth_failed' });
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
      return res.status(403).json({ error: 'Forbidden', reason: decisionResult.reason });
    }

    // 4. Analisar comportamento (detecção de anomalia)
    const anomaly = detector.check(user, req, decisionResult);
    if (anomaly) {
      audit.record(user, req, { stage: 'anomaly', anomaly });
      const action = anomaly.action || 'alert';
      if (action === 'block') {
        return res.status(429).json({ error: 'Request rate exceeded' });
      }
    }

    // 5. Encaminhar requisição com possível filtragem
    const backendResp = await proxy.forward(req, decisionResult.filteredPayload || req.body, user);

    // 6. Registrar resposta
    audit.record(user, req, { stage: 'post', status: backendResp.status });

    return res.status(backendResp.status).send(backendResp.body);

  } catch (error) {
    audit.record(null, req, { stage: 'error', error: error.message });
    return fallback.handleFailure(req, res, error);
  }
}

module.exports = { middleware };
