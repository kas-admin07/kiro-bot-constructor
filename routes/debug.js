const express = require('express');
const DebugManager = require('../utils/DebugManager');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Глобальный экземпляр менеджера отладки
const debugManager = new DebugManager();

/**
 * Создание сессии отладки
 * POST /api/debug/session
 */
router.post('/session', async (req, res) => {
  try {
    const { botId, userId } = req.body;
    
    if (!botId) {
      return res.status(400).json({
        success: false,
        error: 'botId обязателен'
      });
    }
    
    // Загружаем схему бота
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    if (!fs.existsSync(botPath)) {
      return res.status(404).json({
        success: false,
        error: 'Бот не найден'
      });
    }
    
    const botData = JSON.parse(fs.readFileSync(botPath, 'utf8'));
    
    // Создаем сессию отладки
    const session = debugManager.createDebugSession(botId, botData, userId);
    
    res.json({
      success: true,
      sessionId: botId,
      status: session.getStatus(),
      message: 'Сессия отладки создана'
    });
    
  } catch (error) {
    console.error('Ошибка создания сессии отладки:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Запуск отладки
 * POST /api/debug/:botId/start
 */
router.post('/:botId/start', async (req, res) => {
  try {
    const { botId } = req.params;
    const { triggerNode, inputData = {} } = req.body;
    
    const session = debugManager.getDebugSession(botId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Сессия отладки не найдена'
      });
    }
    
    // Запускаем отладку
    session.start(triggerNode, inputData);
    
    res.json({
      success: true,
      status: session.getStatus(),
      currentNode: session.getCurrentNode()?.id,
      variables: session.getVariables()
    });
    
  } catch (error) {
    console.error('Ошибка запуска отладки:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Остановка отладки
 * POST /api/debug/:botId/stop
 */
router.post('/:botId/stop', async (req, res) => {
  try {
    const { botId } = req.params;
    
    const session = debugManager.getDebugSession(botId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Сессия отладки не найдена'
      });
    }
    
    session.stop();
    
    res.json({
      success: true,
      status: session.getStatus(),
      executionTime: session.getExecutionTime(),
      stepCount: session.stepCount
    });
    
  } catch (error) {
    console.error('Ошибка остановки отладки:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Пауза/продолжение отладки
 * POST /api/debug/:botId/pause
 * POST /api/debug/:botId/resume
 */
router.post('/:botId/pause', async (req, res) => {
  try {
    const { botId } = req.params;
    const session = debugManager.getDebugSession(botId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Сессия отладки не найдена'
      });
    }
    
    session.pause();
    
    res.json({
      success: true,
      status: session.getStatus(),
      currentNode: session.getCurrentNode()?.id
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/:botId/resume', async (req, res) => {
  try {
    const { botId } = req.params;
    const session = debugManager.getDebugSession(botId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Сессия отладки не найдена'
      });
    }
    
    session.resume();
    
    res.json({
      success: true,
      status: session.getStatus(),
      currentNode: session.getCurrentNode()?.id
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Пошаговое выполнение
 * POST /api/debug/:botId/step
 */
router.post('/:botId/step', async (req, res) => {
  try {
    const { botId } = req.params;
    const session = debugManager.getDebugSession(botId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Сессия отладки не найдена'
      });
    }
    
    session.stepOver();
    
    res.json({
      success: true,
      status: session.getStatus(),
      currentNode: session.getCurrentNode()?.id,
      variables: session.getVariables()
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Управление точками останова
 * POST /api/debug/:botId/breakpoint
 * DELETE /api/debug/:botId/breakpoint/:nodeId
 */
router.post('/:botId/breakpoint', async (req, res) => {
  try {
    const { botId } = req.params;
    const { nodeId } = req.body;
    
    if (!nodeId) {
      return res.status(400).json({
        success: false,
        error: 'nodeId обязателен'
      });
    }
    
    debugManager.setBreakpoint(botId, nodeId);
    
    res.json({
      success: true,
      breakpoints: debugManager.getBreakpoints(botId)
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:botId/breakpoint/:nodeId', async (req, res) => {
  try {
    const { botId, nodeId } = req.params;
    
    debugManager.removeBreakpoint(botId, nodeId);
    
    res.json({
      success: true,
      breakpoints: debugManager.getBreakpoints(botId)
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Получение состояния отладки
 * GET /api/debug/:botId/status
 */
router.get('/:botId/status', async (req, res) => {
  try {
    const { botId } = req.params;
    const session = debugManager.getDebugSession(botId);
    
    if (!session) {
      return res.json({
        success: true,
        exists: false,
        status: 'no_session'
      });
    }
    
    res.json({
      success: true,
      exists: true,
      status: session.getStatus(),
      currentNode: session.getCurrentNode()?.id,
      variables: session.getVariables(),
      executionTime: session.getExecutionTime(),
      stepCount: session.stepCount,
      breakpoints: debugManager.getBreakpoints(botId),
      executionHistory: session.getExecutionHistory()
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Получение переменных
 * GET /api/debug/:botId/variables
 */
router.get('/:botId/variables', async (req, res) => {
  try {
    const { botId } = req.params;
    const session = debugManager.getDebugSession(botId);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Сессия отладки не найдена'
      });
    }
    
    res.json({
      success: true,
      variables: session.getVariables()
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Установка переменной
 * POST /api/debug/:botId/variables
 */
router.post('/:botId/variables', async (req, res) => {
  try {
    const { botId } = req.params;
    const { name, value } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name обязателен'
      });
    }
    
    const session = debugManager.getDebugSession(botId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Сессия отладки не найдена'
      });
    }
    
    session.setVariable(name, value);
    
    res.json({
      success: true,
      variables: session.getVariables()
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Получение статистики отладки
 * GET /api/debug/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = debugManager.getDebugStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;