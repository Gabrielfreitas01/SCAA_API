/**
 * Admin Routes - Endpoints para gerenciamento e monitoramento
 * Estes endpoints fornecem visibilidade sobre anomalias e comportamento do sistema
 */

const logStore = require('../storage/logStore');
const detector = require('./detector');
const express = require('express');
const router = express.Router();

/**
 * GET /admin/security/stats
 * Retorna estatísticas de segurança das últimas 24 horas
 */
router.get('/admin/security/stats', (req, res) => {
  try {
    const stats = logStore.getSecurityStats(24);
    const topUsers = Object.entries(stats.topAffectedUsers)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [user, count]) => {
        obj[user] = count;
        return obj;
      }, {});

    res.json({
      period: '24 horas',
      stats: {
        totalEvents: stats.totalEvents,
        totalAnomalies: stats.totalAnomalies,
        totalBlockedAttempts: stats.totalBlockedAttempts,
      },
      anomaliesBySeverity: stats.anomaliesBySeverity,
      anomalyTypes: stats.anomalyTypes,
      topAffectedUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/anomalies
 * Retorna anomalias recentes com filtros opcionais
 * Query params: ?hours=24&severity=critical
 */
router.get('/admin/anomalies', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const severity = req.query.severity || null;

    const anomalies = logStore.getAnomalies(hours, severity);

    res.json({
      count: anomalies.length,
      filter: {
        hours,
        severity: severity || 'all',
      },
      anomalies: anomalies.slice(-100), // Últimas 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/user/:userId/activity
 * Retorna atividade de um usuário específico
 */
router.get('/admin/user/:userId/activity', (req, res) => {
  try {
    const userId = req.params.userId;
    const hours = parseInt(req.query.hours) || 24;

    const events = logStore.getEventsByUser(userId, hours);
    const stats = detector.getUserStats(userId);

    res.json({
      userId,
      period: `${hours} horas`,
      stats,
      events: events.slice(-50), // Últimos 50 eventos
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/user/:userId/anomalies
 * Retorna anomalias de um usuário específico
 */
router.get('/admin/user/:userId/anomalies', (req, res) => {
  try {
    const userId = req.params.userId;
    const hours = parseInt(req.query.hours) || 24;

    const allAnomalies = logStore.getAnomalies(hours);
    const userAnomalies = allAnomalies.filter(a => a.userId === userId);

    res.json({
      userId,
      count: userAnomalies.length,
      anomalies: userAnomalies,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/health
 * Verifica saúde do sistema
 */
router.get('/admin/health', (req, res) => {
  try {
    const stats = logStore.getSecurityStats(1); // Última 1 hora
    const recentAnomalies = logStore.getAnomalies(0.1); // Últimos 6 minutos

    const health = {
      status: 'operational',
      timestamp: new Date().toISOString(),
      lastHour: {
        events: stats.totalEvents,
        anomalies: stats.totalAnomalies,
        blocked: stats.totalBlockedAttempts,
      },
      recentAnomalies: {
        count: recentAnomalies.length,
        critical: recentAnomalies.filter(a => a.severity === 'critical').length,
      },
      systemStatus: {
        logsAvailable: true,
        detectorActive: true,
      },
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      error: error.message,
    });
  }
});

/**
 * POST /admin/logs/export
 * Exporta logs em formato CSV
 * Body: { logType: 'anomalies|events', hours: 24 }
 */
router.post('/admin/logs/export', (req, res) => {
  try {
    const { logType = 'anomalies', hours = 24 } = req.body;

    const csv = logStore.exportToCsv(logType, hours);

    if (!csv) {
      return res.json({ message: 'Nenhum dado para exportar' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="scaa_${logType}_${new Date().toISOString().split('T')[0]}.csv"`
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/logs/cleanup
 * Remove logs antigos
 * Body: { daysToKeep: 30 }
 */
router.post('/admin/logs/cleanup', (req, res) => {
  try {
    const { daysToKeep = 30 } = req.body;

    logStore.cleanupOldLogs(daysToKeep);

    res.json({
      message: 'Limpeza de logs realizada',
      daysToKeep,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /admin/detector/clear/:userId
 * Limpa dados de um usuário do detector (útil para testes)
 */
router.post('/admin/detector/clear/:userId', (req, res) => {
  try {
    const userId = req.params.userId;

    detector.clearUserData(userId);

    res.json({
      message: `Dados do usuário ${userId} foram limpos`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/config/anomaly-profiles
 * Retorna os perfis de anomalia disponíveis
 */
router.get('/admin/config/anomaly-profiles', (req, res) => {
  try {
    const rulesConfig = require('../config/rules.json');
    const profiles = rulesConfig.anomalyProfiles;

    res.json({
      profiles,
      description: 'Perfis de anomalia definem limites de detecção por papel do usuário',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/config/detection-rules
 * Retorna as regras de detecção configuradas
 */
router.get('/admin/config/detection-rules', (req, res) => {
  try {
    const rulesConfig = require('../config/rules.json');
    const rules = rulesConfig.detectionRules;

    res.json({
      rules,
      count: Object.keys(rules).length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /admin/dashboard
 * Dashboard com visão geral consolidada
 */
router.get('/admin/dashboard', (req, res) => {
  try {
    const stats24h = logStore.getSecurityStats(24);
    const stats1h = logStore.getSecurityStats(1);
    const recentAnomalies = logStore.getAnomalies(0.25); // Últimos 15 minutos

    const dashboard = {
      timestamp: new Date().toISOString(),
      period24h: {
        totalEvents: stats24h.totalEvents,
        totalAnomalies: stats24h.totalAnomalies,
        blocked: stats24h.totalBlockedAttempts,
        anomaliesBySeverity: stats24h.anomaliesBySeverity,
        topAnomalies: Object.entries(stats24h.anomalyTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .reduce((obj, [type, count]) => {
            obj[type] = count;
            return obj;
          }, {}),
      },
      period1h: {
        totalEvents: stats1h.totalEvents,
        totalAnomalies: stats1h.totalAnomalies,
        blocked: stats1h.totalBlockedAttempts,
      },
      recentAlerts: {
        criticalLast15Min: recentAnomalies.filter(a => a.severity === 'critical').length,
        highLast15Min: recentAnomalies.filter(a => a.severity === 'high').length,
      },
      systemStatus: {
        logsOperational: true,
        detectorRunning: true,
        lastUpdate: new Date().toISOString(),
      },
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
