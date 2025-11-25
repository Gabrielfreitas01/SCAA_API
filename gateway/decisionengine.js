const rules = require('../config/rules.json');

function loadRulesFor(role) {
  return rules.roles[role] || null;
}

function evaluate(user, req, roleRules) {
  if (!roleRules) return { allowed: false, reason: 'role_not_found' };

  // mapear recurso/ação básico
  const method = req.method.toLowerCase();
  const resource = req.path.split('/')[1]; // ex: /clientes → 'clientes'

  const resourcePolicy = roleRules.resources[resource];
  if (!resourcePolicy) return { allowed: false, reason: 'no_resource_permission' };

  const action = method === 'get' ? 'read' : method === 'post' ? 'write' : 'unknown';
  if (!resourcePolicy.actions.includes(action)) {
    return { allowed: false, reason: 'action_not_allowed' };
  }

  return { allowed: true, filteredPayload: req.body || {} };
}

module.exports = { loadRulesFor, evaluate };
