const express = require('express');
const { getPerformanceStats } = require('../utils/OptimizationMiddleware');
const { apiCache, generalCache } = require('../utils/CacheManager');

const router = express.Router();

router.get('/stats', (req, res) => {
  try {
    const stats = getPerformanceStats();
    
    stats.cache.api.sizeInfo = apiCache.getSizeInfo();
    stats.cache.general.sizeInfo = generalCache.getSizeInfo();
    
    stats.system = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/cache/clear', (req, res) => {
  try {
    const { type } = req.body;
    let cleared = 0;
    
    switch (type) {
      case 'api':
        apiCache.clear();
        cleared = 1;
        break;
      case 'general':
        generalCache.clear();
        cleared = 1;
        break;
      case 'all':
      default:
        apiCache.clear();
        generalCache.clear();
        cleared = 2;
        break;
    }
    
    res.json({
      success: true,
      message: `Очищено кэшей: ${cleared}`
    });
  } catch (error) {
    console.error('Ошибка очистки кэша:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/slow-requests', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const slowRequests = [];
    
    for (const [key, stats] of generalCache.cache.entries()) {
      if (key.startsWith('perf:')) {
        const [, method, path] = key.split(':');
        if (stats.avgTime > 500) {
          slowRequests.push({
            endpoint: `${method} ${path}`,
            avgTime: stats.avgTime,
            maxTime: stats.maxTime,
            count: stats.count
          });
        }
      }
    }
    
    slowRequests.sort((a, b) => b.avgTime - a.avgTime);
    
    res.json({
      success: true,
      data: slowRequests.slice(0, limit)
    });
  } catch (error) {
    console.error('Ошибка получения медленных запросов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;