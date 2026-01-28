/**
 * Mapeia rota para recurso baseado no padrão de URL
 * Ex: /clientes/123 → 'clientes'
 */
function mapRouteToResource(req) {
  const pathParts = req.path.split('/').filter(p => p);
  return pathParts[0] || 'root';
}

/**
 * Calcula o tamanho de um payload em bytes
 */
function getPayloadSize(data) {
  if (!data) return 0;
  try {
    return JSON.stringify(data).length;
  } catch {
    return 0;
  }
}

/**
 * Normaliza um valor numérico para um intervalo (0-1)
 */
function normalize(value, min, max) {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calcula desvio padrão de um array de números
 */
function standardDeviation(numbers) {
  if (numbers.length === 0) return 0;
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squareDiffs = numbers.map(value => Math.pow(value - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / numbers.length;
  return Math.sqrt(avgSquareDiff);
}

/**
 * Calcula a média de um array
 */
function mean(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

/**
 * Detecta outliers usando o método do Z-score
 * Z-score > 2 é considerado outlier (95% de confiança)
 */
function detectOutliers(numbers, zScoreThreshold = 2) {
  if (numbers.length < 2) return [];

  const avg = mean(numbers);
  const stdDev = standardDeviation(numbers);

  if (stdDev === 0) return []; // Todos os valores são iguais

  return numbers
    .map((num, idx) => ({
      value: num,
      index: idx,
      zScore: (num - avg) / stdDev,
    }))
    .filter(item => Math.abs(item.zScore) > zScoreThreshold);
}

/**
 * Formata bytes para unidade legível (KB, MB, GB)
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * Máscara um valor sensível (CPF, Email, etc)
 */
function maskSensitive(value, type = 'generic') {
  if (!value) return '';

  const str = String(value);

  switch (type) {
    case 'cpf': // 123.456.789-00 → 123.456.***-**
      return str.replace(/(\d{3})\.(\d{3})\.(\d{3})(-?)(\d{2})/, '$1.$2.***$4**');

    case 'cnpj': // XX.XXX.XXX/0001-XX → XX.XXX.***/***** -XX
      return str.replace(/(\d{2})\.(\d{3})\.(\d{3})(\/?)(0001)(-?)(\d{2})/, '$1.$2.***$4*****$6**');

    case 'email': // user@example.com → u***@example.com
      return str.replace(/^(.)(.*)(@.*)$/, '$1***$3');

    case 'phone': // (11) 98765-4321 → (11) 9****-****
      return str.replace(/(\d{2})(\s?\d{5})(-?)(\d{4})/, '$1 9****$3****');

    case 'generic': // ****test****
      return '*'.repeat(Math.max(4, Math.floor(str.length / 2))) + str.slice(-3);

    default:
      return str;
  }
}

/**
 * Valida se um token JWT é estruturalmente válido
 * (não valida assinatura, apenas formato)
 */
function isValidJWTFormat(token) {
  const parts = token?.split('.');
  if (!parts || parts.length !== 3) return false;

  try {
    // Tentar decodificar as partes (não valida assinatura)
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

    return (
      header.alg &&
      header.typ &&
      payload.iat &&
      payload.exp
    );
  } catch {
    return false;
  }
}

/**
 * Compara dois objetos de configuração e retorna diferenças
 */
function diffObjects(obj1, obj2) {
  const diff = {};

  const allKeys = new Set([
    ...Object.keys(obj1 || {}),
    ...Object.keys(obj2 || {}),
  ]);

  allKeys.forEach(key => {
    if (JSON.stringify(obj1?.[key]) !== JSON.stringify(obj2?.[key])) {
      diff[key] = {
        old: obj1?.[key],
        new: obj2?.[key],
      };
    }
  });

  return diff;
}

/**
 * Rate limiter simples em memória
 * Retorna true se deve fazer throttle
 */
const rateLimiters = new Map();

function shouldThrottle(key, maxRequests, windowMs) {
  const now = Date.now();

  if (!rateLimiters.has(key)) {
    rateLimiters.set(key, { requests: [], lastReset: now });
  }

  const limiter = rateLimiters.get(key);

  // Limpar requisições antigas
  limiter.requests = limiter.requests.filter(
    time => now - time < windowMs
  );

  // Adicionar requisição atual
  limiter.requests.push(now);

  const shouldThrottle = limiter.requests.length > maxRequests;

  // Limpar limiter se vazio e antigo
  if (limiter.requests.length === 0 && now - limiter.lastReset > windowMs) {
    rateLimiters.delete(key);
  }

  return shouldThrottle;
}

/**
 * Obtém estatísticas de rate limiter
 */
function getRateLimiterStats(key) {
  const limiter = rateLimiters.get(key);
  if (!limiter) return null;

  return {
    currentRequests: limiter.requests.length,
    lastActivity: limiter.requests[limiter.requests.length - 1],
  };
}

module.exports = {
  mapRouteToResource,
  getPayloadSize,
  normalize,
  standardDeviation,
  mean,
  detectOutliers,
  formatBytes,
  maskSensitive,
  isValidJWTFormat,
  diffObjects,
  shouldThrottle,
  getRateLimiterStats,
};
