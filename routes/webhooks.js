const express = require('express');
const router = express.Router();

// Глобальный экземпляр BotRuntime будет инициализирован в server.js
let botRuntime = null;

// Функция для установки экземпляра BotRuntime
function setBotRuntime(runtime) {
  botRuntime = runtime;
}

// POST /webhook/:botId - обработка webhook'ов от Telegram
router.post('/:botId', async (req, res) => {
  try {
    const botId = req.params.botId;
    const update = req.body;

    if (!botRuntime) {
      console.error('BotRuntime не инициализирован');
      return res.status(500).json({ error: 'Runtime not initialized' });
    }

    // Получаем экземпляр бота
    const botInstance = botRuntime.activeBots.get(botId);
    
    if (!botInstance) {
      console.error(`Бот ${botId} не найден`);
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    // Обрабатываем сообщение
    if (update.message) {
      await botRuntime.processMessage(botInstance, update.message);
    } else if (update.callback_query) {
      // Обработка callback_query
      console.log(`📲 Получен callback_query от ${update.callback_query.from.first_name}`);
      // TODO: Добавить обработку callback_query
    }

    // Отвечаем Telegram что сообщение получено
    res.status(200).json({ ok: true });

  } catch (error) {
    console.error('Ошибка обработки webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /webhook/:botId - информация о webhook'е (для отладки)
router.get('/:botId', (req, res) => {
  const botId = req.params.botId;
  
  if (!botRuntime) {
    return res.status(500).json({ error: 'Runtime not initialized' });
  }

  const botInfo = botRuntime.getBotInfo(botId);
  
  if (!botInfo) {
    return res.status(404).json({ error: 'Bot not found' });
  }

  res.json({
    success: true,
    data: {
      botId: botInfo.id,
      name: botInfo.name,
      status: botInfo.status,
      webhookPath: botInfo.webhookPath,
      stats: botInfo.stats
    }
  });
});

module.exports = { router, setBotRuntime };