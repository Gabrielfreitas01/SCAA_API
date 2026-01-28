const fs = require('fs');
const path = require('path');

// Diretório para armazenar logs
const LOG_DIR = path.join(__dirname, '../logs');
const EVENTS_LOG = path.join(LOG_DIR, 'events.jsonl'); // JSON Lines format
const ANOMALIES_LOG = path.join(LOG_DIR, 'anomalies.jsonl');
const BLOCKED_ATTEMPTS_LOG = path.join(LOG_DIR, 'blocked_attempts.jsonl');

// Garantir que o diretório existe
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Registra um evento de segurança no arquivo de logs
 */
function logEvent(eventData) {
  const entry = {
    timestamp: new Date().toISOString(),
    ...eventData,
  };

  const logLine = JSON.stringify(entry) + '\n';
  
  try {
    fs.appendFileSync(EVENTS_LOG, logLine, { encoding: 'utf8' });
  } catch (err) {
    console.error('[LogStore] Erro ao escrever evento:', err.message);
  }

  return entry;
}

/**
 * Registra uma anomalia detectada
 */
function logAnomaly(userId, anomalyData) {
  const entry = {
    timestamp: new Date().toISOString(),
    userId,
    ...anomalyData,
  };

  const logLine = JSON.stringify(entry) + '\n';

  try {
    fs.appendFileSync(ANOMALIES_LOG, logLine, { encoding: 'utf8' });
  } catch (err) {
    console.error('[LogStore] Erro ao escrever anomalia:', err.message);
  }

  return entry;
}

/**
 * Registra tentativas de acesso bloqueado
 */
function logBlockedAttempt(userId, attemptData) {
  const entry = {
    timestamp: new Date().toISOString(),
    userId,
    ...attemptData,
  };

  const logLine = JSON.stringify(entry) + '\n';

  try {
    fs.appendFileSync(BLOCKED_ATTEMPTS_LOG, logLine, { encoding: 'utf8' });
  } catch (err) {
    console.error('[LogStore] Erro ao escrever tentativa bloqueada:', err.message);
  }

  return entry;
}

/**
 * Lê eventos de um usuário em um período específico
 */
function getEventsByUser(userId, hoursBack = 24) {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const events = [];

  try {
    const content = fs.readFileSync(EVENTS_LOG, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      try {
        const event = JSON.parse(line);
        if (event.userId === userId && new Date(event.timestamp) >= cutoffTime) {
          events.push(event);
        }
      } catch (e) {
        // Linha mal formatada, ignorar
      }
    });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[LogStore] Erro ao ler eventos:', err.message);
    }
  }

  return events;
}

/**
 * Lê anomalias de um período
 */
function getAnomalies(hoursBack = 24, severity = null) {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const anomalies = [];

  try {
    const content = fs.readFileSync(ANOMALIES_LOG, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());

    lines.forEach(line => {
      try {
        const event = JSON.parse(line);
        if (new Date(event.timestamp) >= cutoffTime) {
          if (!severity || event.severity === severity) {
            anomalies.push(event);
          }
        }
      } catch (e) {
        // Linha mal formatada, ignorar
      }
    });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[LogStore] Erro ao ler anomalias:', err.message);
    }
  }

  return anomalies;
}

/**
 * Retorna estatísticas de segurança
 */
function getSecurityStats(hoursBack = 24) {
  const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  const stats = {
    totalEvents: 0,
    totalAnomalies: 0,
    totalBlockedAttempts: 0,
    anomaliesBySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
    topAffectedUsers: {},
    anomalyTypes: {},
  };

  try {
    // Processar anomalias
    const anomalyContent = fs.readFileSync(ANOMALIES_LOG, 'utf8');
    const anomalyLines = anomalyContent.split('\n').filter(line => line.trim());

    anomalyLines.forEach(line => {
      try {
        const event = JSON.parse(line);
        if (new Date(event.timestamp) >= cutoffTime) {
          stats.totalAnomalies++;
          stats.anomaliesBySeverity[event.severity] =
            (stats.anomaliesBySeverity[event.severity] || 0) + 1;

          stats.topAffectedUsers[event.userId] =
            (stats.topAffectedUsers[event.userId] || 0) + 1;

          if (event.anomalies) {
            event.anomalies.forEach(anom => {
              stats.anomalyTypes[anom.type] =
                (stats.anomalyTypes[anom.type] || 0) + 1;
            });
          }
        }
      } catch (e) {
        // Ignorar
      }
    });

    // Processar eventos bloqueados
    const blockedContent = fs.readFileSync(BLOCKED_ATTEMPTS_LOG, 'utf8');
    const blockedLines = blockedContent.split('\n').filter(line => line.trim());

    blockedLines.forEach(line => {
      try {
        const event = JSON.parse(line);
        if (new Date(event.timestamp) >= cutoffTime) {
          stats.totalBlockedAttempts++;
        }
      } catch (e) {
        // Ignorar
      }
    });
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[LogStore] Erro ao ler estatísticas:', err.message);
    }
  }

  return stats;
}

/**
 * Limpa logs antigos (retention policy)
 */
function cleanupOldLogs(daysToKeep = 30) {
  const cutoffTime = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
  const logFiles = [EVENTS_LOG, ANOMALIES_LOG, BLOCKED_ATTEMPTS_LOG];

  logFiles.forEach(logFile => {
    try {
      if (!fs.existsSync(logFile)) return;

      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      const filteredLines = lines.filter(line => {
        try {
          const event = JSON.parse(line);
          return new Date(event.timestamp) >= cutoffTime;
        } catch (e) {
          return true; // Manter linhas inválidas por segurança
        }
      });

      fs.writeFileSync(logFile, filteredLines.join('\n') + '\n', 'utf8');
      console.log(`[LogStore] Limpeza de logs realizada: ${logFile}`);
    } catch (err) {
      console.error(`[LogStore] Erro ao limpar ${logFile}:`, err.message);
    }
  });
}

/**
 * Exporta logs em formato CSV para análise
 */
function exportToCsv(logType = 'anomalies', hoursBack = 24) {
  const data = logType === 'anomalies'
    ? getAnomalies(hoursBack)
    : getEventsByUser(null, hoursBack);

  if (data.length === 0) return '';

  // Obter todas as chaves
  const allKeys = new Set();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });

  const headers = Array.from(allKeys);
  const csvLines = [headers.join(',')];

  data.forEach(item => {
    const values = headers.map(header => {
      const value = item[header];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvLines.push(values.join(','));
  });

  return csvLines.join('\n');
}

module.exports = {
  logEvent,
  logAnomaly,
  logBlockedAttempt,
  getEventsByUser,
  getAnomalies,
  getSecurityStats,
  cleanupOldLogs,
  exportToCsv,
  LOG_DIR,
};
