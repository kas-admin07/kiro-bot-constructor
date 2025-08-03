const express = require('express');
const router = express.Router();

// Глобальный экземпляр BotRuntime
let botRuntime = null;

// Функция для установки экземпляра BotRuntime
function setBotRuntime(runtime) {
  botRuntime = runtime;
}

// ⚠️ АВТОРИЗАЦИЯ ПОЛНОСТЬЮ УДАЛЕНА - АДМИНСКАЯ ПАНЕЛЬ БЕЗ ОГРАНИЧЕНИЙ ⚠️

// GET /api/runtime/stats - общая статистика среды выполнения
router.get('/stats', (req, res) => {
  try {
    if (!botRuntime) {
      return res.status(500).json({
        success: false,
        error: 'Runtime не инициализирован'
      });
    }

    const stats = botRuntime.getRuntimeStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Ошибка получения статистики runtime:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики'
    });
  }
});

// POST /api/runtime/bots/:id/start - запуск бота
router.post('/bots/:id/start', async (req, res) => {
  try {
    const botId = req.params.id;

    if (!botRuntime) {
      return res.status(500).json({
        success: false,
        error: 'Runtime не инициализирован'
      });
    }

    // Загружаем конфигурацию бота из файла
    const fs = require('fs').promises;
    const path = require('path');
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    const botData = await fs.readFile(botPath, 'utf8');
    const botConfig = JSON.parse(botData);

    // Проверяем права доступа
    if (botConfig.userId !== req.user.telegramId) {
      return res.status(403).json({
        success: false,
        error: 'Нет доступа к этому боту'
      });
    }

    // Проверяем наличие токена
    if (!botConfig.token) {
      return res.status(400).json({
        success: false,
        error: 'У бота не настроен токен. Добавьте токен от @BotFather'
      });
    }

    // Запускаем бота
    await botRuntime.loadBot(botId, botConfig);

    // Обновляем статус в файле
    botConfig.status = 'active';
    botConfig.updatedAt = new Date().toISOString();
    await fs.writeFile(botPath, JSON.stringify(botConfig, null, 2));

    res.json({
      success: true,
      message: `Бот ${botConfig.name} успешно запущен`
    });

  } catch (error) {
    console.error('Ошибка запуска бота:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка запуска бота'
    });
  }
});

// POST /api/runtime/bots/:id/stop - остановка бота
router.post('/bots/:id/stop', async (req, res) => {
  try {
    const botId = req.params.id;

    if (!botRuntime) {
      return res.status(500).json({
        success: false,
        error: 'Runtime не инициализирован'
      });
    }

    // Проверяем права доступа
    const fs = require('fs').promises;
    const path = require('path');
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    const botData = await fs.readFile(botPath, 'utf8');
    const botConfig = JSON.parse(botData);

    if (botConfig.userId !== req.user.telegramId) {
      return res.status(403).json({
        success: false,
        error: 'Нет доступа к этому боту'
      });
    }

    // Останавливаем бота
    const stopped = await botRuntime.stopBot(botId);

    if (stopped) {
      // Обновляем статус в файле
      botConfig.status = 'inactive';
      botConfig.updatedAt = new Date().toISOString();
      await fs.writeFile(botPath, JSON.stringify(botConfig, null, 2));

      res.json({
        success: true,
        message: `Бот ${botConfig.name} остановлен`
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Бот не найден среди активных'
      });
    }

  } catch (error) {
    console.error('Ошибка остановки бота:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка остановки бота'
    });
  }
});

// POST /api/runtime/bots/:id/reload - перезагрузка бота
router.post('/bots/:id/reload', async (req, res) => {
  try {
    const botId = req.params.id;

    if (!botRuntime) {
      return res.status(500).json({
        success: false,
        error: 'Runtime не инициализирован'
      });
    }

    // Проверяем права доступа
    const fs = require('fs').promises;
    const path = require('path');
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    const botData = await fs.readFile(botPath, 'utf8');
    const botConfig = JSON.parse(botData);

    if (botConfig.userId !== req.user.telegramId) {
      return res.status(403).json({
        success: false,
        error: 'Нет доступа к этому боту'
      });
    }

    // Перезагружаем бота
    const reloaded = await botRuntime.reloadBot(botId);

    if (reloaded) {
      res.json({
        success: true,
        message: `Бот ${botConfig.name} перезагружен`
      });
    } else {
      res.json({
        success: true,
        message: `Бот ${botConfig.name} остановлен (неактивен или нет токена)`
      });
    }

  } catch (error) {
    console.error('Ошибка перезагрузки бота:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка перезагрузки бота'
    });
  }
});

// GET /api/runtime/bots/:id/info - информация о запущенном боте
router.get('/bots/:id/info', (req, res) => {
  try {
    const botId = req.params.id;

    if (!botRuntime) {
      return res.status(500).json({
        success: false,
        error: 'Runtime не инициализирован'
      });
    }

    const botInfo = botRuntime.getBotInfo(botId);

    if (!botInfo) {
      return res.status(404).json({
        success: false,
        error: 'Бот не найден среди активных'
      });
    }

    res.json({
      success: true,
      data: botInfo
    });

  } catch (error) {
    console.error('Ошибка получения информации о боте:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения информации'
    });
  }
});

module.exports = { router, setBotRuntime };