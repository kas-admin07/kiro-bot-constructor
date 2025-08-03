/**
 * API для логирования событий canvas редактора
 */
const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Путь к файлу логов canvas
const CANVAS_LOG_FILE = path.join(__dirname, '..', 'canvas-debug.log');

/**
 * POST /api/canvas-log
 * Логирование событий canvas редактора
 */
router.post('/', (req, res) => {
  try {
    const { timestamp, level, message, data } = req.body;
    
    // Формируем запись лога
    const logEntry = {
      timestamp: timestamp || new Date().toISOString(),
      level: level || 'INFO',
      message: message || 'Canvas event',
      data: data || {}
    };
    
    // Форматируем для записи в файл
    const logLine = `[${logEntry.timestamp}] ${logEntry.level}: ${logEntry.message}\n`;
    
    if (logEntry.data && Object.keys(logEntry.data).length > 0) {
      const dataLine = `Data: ${JSON.stringify(logEntry.data, null, 2)}\n`;
      fs.appendFileSync(CANVAS_LOG_FILE, logLine + dataLine + '\n');
    } else {
      fs.appendFileSync(CANVAS_LOG_FILE, logLine + '\n');
    }
    
    // Также выводим в консоль для разработки
    console.log(`[CANVAS] ${logEntry.level}: ${logEntry.message}`);
    if (logEntry.data && Object.keys(logEntry.data).length > 0) {
      console.log('[CANVAS] Data:', logEntry.data);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Ошибка записи canvas лога:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка записи лога'
    });
  }
});

/**
 * GET /api/canvas-log
 * Получение последних записей canvas логов
 */
router.get('/', (req, res) => {
  try {
    const lines = parseInt(req.query.lines) || 100;
    
    if (!fs.existsSync(CANVAS_LOG_FILE)) {
      return res.json({
        success: true,
        logs: [],
        message: 'Файл логов не найден'
      });
    }
    
    const content = fs.readFileSync(CANVAS_LOG_FILE, 'utf8');
    const logLines = content.split('\n').filter(line => line.trim());
    
    // Возвращаем последние N строк
    const recentLogs = logLines.slice(-lines);
    
    res.json({
      success: true,
      logs: recentLogs,
      total: logLines.length
    });
  } catch (error) {
    console.error('Ошибка чтения canvas логов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка чтения логов'
    });
  }
});

/**
 * DELETE /api/canvas-log
 * Очистка canvas логов
 */
router.delete('/', (req, res) => {
  try {
    if (fs.existsSync(CANVAS_LOG_FILE)) {
      fs.unlinkSync(CANVAS_LOG_FILE);
    }
    
    res.json({
      success: true,
      message: 'Canvas логи очищены'
    });
  } catch (error) {
    console.error('Ошибка очистки canvas логов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка очистки логов'
    });
  }
});

module.exports = router;