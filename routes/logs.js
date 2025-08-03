const express = require('express');
const Logger = require('../utils/Logger');
const router = express.Router();

const logger = new Logger();

/**
 * Получение логов бота
 * GET /api/logs/:botId?eventType=&hours=24
 */
router.get('/:botId', async (req, res) => {
  try {
    const { botId } = req.params;
    const { eventType, hours = 24 } = req.query;
    
    // Вычисляем временной диапазон
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (parseInt(hours) * 60 * 60 * 1000));
    
    // Получаем логи
    const logs = await logger.getBotLogs(botId, startDate, endDate, eventType || null);
    
    // Получаем статистику
    const stats = await logger.getBotStats(botId, startDate, endDate);
    
    res.json({
      success: true,
      logs: logs.reverse(), // Показываем новые логи сверху
      stats,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        hours: parseInt(hours)
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения логов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Получение статистики всех ботов
 * GET /api/logs/system/stats
 */
router.get('/system/stats', async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    
    // Получаем список всех ботов
    const fs = require('fs');
    const path = require('path');
    const botsDir = path.join(__dirname, '..', 'data', 'bots');
    
    if (!fs.existsSync(botsDir)) {
      return res.json({
        success: true,
        stats: {
          totalBots: 0,
          activeBots: 0,
          totalEvents: 0,
          totalUsers: 0
        }
      });
    }
    
    const botFiles = fs.readdirSync(botsDir).filter(file => file.startsWith('bot_') && file.endsWith('.json'));
    
    let totalEvents = 0;
    let totalUsers = new Set();
    let activeBots = 0;
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (parseInt(hours) * 60 * 60 * 1000));
    
    // Собираем статистику по всем ботам
    for (const botFile of botFiles) {
      const botId = botFile.replace('bot_', '').replace('.json', '');
      
      try {
        const stats = await logger.getBotStats(botId, startDate, endDate);
        
        if (stats.totalEvents > 0) {
          activeBots++;
          totalEvents += stats.totalEvents;
          
          // Добавляем уникальных пользователей (приблизительно)
          for (let i = 0; i < stats.activeUsers; i++) {
            totalUsers.add(`${botId}_user_${i}`);
          }
        }
      } catch (error) {
        // Пропускаем ботов без логов
        continue;
      }
    }
    
    res.json({
      success: true,
      stats: {
        totalBots: botFiles.length,
        activeBots,
        totalEvents,
        totalUsers: totalUsers.size
      },
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        hours: parseInt(hours)
      }
    });
    
  } catch (error) {
    console.error('Ошибка получения системной статистики:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Очистка старых логов
 * DELETE /api/logs/cleanup?months=12
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    await logger.cleanupOldLogs(parseInt(months));
    
    res.json({
      success: true,
      message: `Старые логи (старше ${months} месяцев) удалены`
    });
    
  } catch (error) {
    console.error('Ошибка очистки логов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Экспорт логов в CSV
 * GET /api/logs/:botId/export?format=csv&hours=24
 */
router.get('/:botId/export', async (req, res) => {
  try {
    const { botId } = req.params;
    const { format = 'csv', hours = 24, eventType } = req.query;
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (parseInt(hours) * 60 * 60 * 1000));
    
    const logs = await logger.getBotLogs(botId, startDate, endDate, eventType || null);
    
    if (format === 'csv') {
      // Генерируем CSV
      const csvHeader = 'Timestamp,Event Type,User ID,Data\n';
      const csvRows = logs.map(log => {
        const timestamp = log.timestamp;
        const eventType = log.eventType;
        const userId = log.data.userId || '';
        const data = JSON.stringify(log.data).replace(/"/g, '""'); // Экранируем кавычки
        
        return `"${timestamp}","${eventType}","${userId}","${data}"`;
      }).join('\n');
      
      const csv = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="logs_${botId}_${Date.now()}.csv"`);
      res.send(csv);
      
    } else if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="logs_${botId}_${Date.now()}.json"`);
      res.json({
        botId,
        period: { startDate, endDate },
        logs
      });
      
    } else {
      res.status(400).json({
        success: false,
        error: 'Неподдерживаемый формат. Используйте csv или json'
      });
    }
    
  } catch (error) {
    console.error('Ошибка экспорта логов:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;