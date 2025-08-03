const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const TokenManager = require('../utils/TokenManager');

const router = express.Router();
const tokenManager = new TokenManager();

// ⚠️ АВТОРИЗАЦИЯ ПОЛНОСТЬЮ ОТКЛЮЧЕНА - АДМИНСКАЯ ПАНЕЛЬ
// НЕ ДОБАВЛЯТЬ АВТОРИЗАЦИЮ В БУДУЩЕМ!

// GET /api/bots - получение списка ботов (админская панель)
router.get('/', async (req, res) => {
  try {
    const botsDir = path.join(__dirname, '..', 'data', 'bots');
    
    // Создаем папку если не существует
    try {
      await fs.access(botsDir);
    } catch {
      await fs.mkdir(botsDir, { recursive: true });
    }
    
    const files = await fs.readdir(botsDir);
    const bots = [];
    
    console.log(`Найдено файлов в ${botsDir}:`, files.length);

    for (const file of files) {
      console.log(`Проверяем файл: ${file}`);
      if (file.endsWith('.json') && file.startsWith('bot_')) {
        console.log(`Обрабатываем файл бота: ${file}`);
        try {
          const filePath = path.join(botsDir, file);
          const botData = await fs.readFile(filePath, 'utf8');
          const bot = JSON.parse(botData);
          
          // Для админской панели показываем всех ботов
          // Добавляем дополнительную информацию для улучшенных карточек
          bot.stats = bot.stats || {
            messagesProcessed: Math.floor(Math.random() * 1000), // Заглушка
            activeUsers: Math.floor(Math.random() * 100),
            errorCount: Math.floor(Math.random() * 10),
            lastActivity: bot.status === 'active' ? new Date().toISOString() : null
          };
          bots.push(bot);
          console.log(`Добавлен бот: ${bot.name || bot.id}`);
        } catch (parseError) {
          console.error(`Ошибка парсинга бота ${file}:`, parseError);
        }
      }
    }

    res.json({
      success: true,
      data: {
        bots: bots,
        total: bots.length
      }
    });

  } catch (error) {
    console.error('Ошибка получения списка ботов:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения списка ботов'
    });
  }
});

// GET /api/bots/:id - получение конкретного бота
router.get('/:id', async (req, res) => {
  try {
    const botId = req.params.id;
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    const botData = await fs.readFile(botPath, 'utf8');
    const bot = JSON.parse(botData);

    // Админская панель - никаких проверок доступа

    res.json({
      success: true,
      data: bot
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Бот не найден'
      });
    }

    console.error('Ошибка получения бота:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения данных бота'
    });
  }
});

// POST /api/bots - создание нового бота
router.post('/', async (req, res) => {
  try {
    const { name, token, description, useVisualEditor, templateId, messengerType } = req.body;
    
    if (!name || !token) {
      return res.status(400).json({
        success: false,
        error: 'Имя и токен бота обязательны'
      });
    }

    // Проверяем уникальность токена (авторизация отключена)
    const isUnique = await tokenManager.checkTokenUniqueness(token, 'admin');
    if (!isUnique) {
      return res.status(400).json({
        success: false,
        error: 'Этот токен уже используется другим ботом'
      });
    }

    // Определяем тип мессенджера (по умолчанию Telegram для обратной совместимости)
    const messenger = messengerType || 'telegram';
    
    // Валидируем токен через соответствующий API
    let validation;
    if (messenger === 'telegram') {
      validation = await tokenManager.validateTokenWithTelegram(token);
    } else if (messenger === 'max') {
      // Валидируем токен MAX через их API
      validation = await tokenManager.validateTokenWithMax(token);
    } else {
      return res.status(400).json({
        success: false,
        error: `Неподдерживаемый мессенджер: ${messenger}`
      });
    }
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: `Недействительный токен для ${messenger}: ${validation.error}`
      });
    }

    const botId = Date.now().toString();
    const bot = {
      id: botId,
      name: name,
      username: validation.botInfo.username,
      messengerType: messenger,
      token: token,
      description: description || '',
      userId: 'admin', // Авторизация отключена
      status: 'inactive',
      useVisualEditor: useVisualEditor || false,
      visualSchemaId: null,
      configuration: {
        nodes: [],
        connections: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Резервируем токен
    await tokenManager.reserveToken(token, 'admin', botId);

    // Сохраняем бота
    const botsDir = path.join(__dirname, '..', 'data', 'bots');
    await fs.mkdir(botsDir, { recursive: true });
    const botPath = path.join(botsDir, `bot_${botId}.json`);
    await fs.writeFile(botPath, JSON.stringify(bot, null, 2));

    // Если используется визуальный редактор, создаем базовую схему
    if (useVisualEditor) {
      await createDefaultVisualSchema(botId, bot.name, templateId);
    }

    res.status(201).json({
      success: true,
      message: 'Бот успешно создан',
      data: bot
    });

  } catch (error) {
    console.error('Ошибка создания бота:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Ошибка создания бота'
    });
  }
});

// PUT /api/bots/:id - обновление бота
router.put('/:id', async (req, res) => {
  try {
    const botId = req.params.id;
    const updates = req.body;
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    // Загружаем существующего бота
    const botData = await fs.readFile(botPath, 'utf8');
    const bot = JSON.parse(botData);

    // Авторизация отключена - пропускаем проверку доступа

    // Если обновляется токен, проверяем его уникальность
    if (updates.token && updates.token !== bot.token) {
      const isUnique = await tokenManager.checkTokenUniqueness(updates.token, 'admin', botId);
      if (!isUnique) {
        return res.status(400).json({
          success: false,
          error: 'Этот токен уже используется другим ботом'
        });
      }

      // Валидируем новый токен
      const validation = await tokenManager.validateTokenWithTelegram(updates.token);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: `Недействительный токен: ${validation.error}`
        });
      }

      // Освобождаем старый токен и резервируем новый
      await tokenManager.releaseToken(bot.token);
      await tokenManager.reserveToken(updates.token, 'admin', botId);
      
      // Обновляем username из Telegram API
      bot.username = validation.botInfo.username;
    }

    // Обновляем разрешенные поля
    const allowedFields = ['name', 'description', 'token', 'status', 'configuration'];
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        bot[field] = updates[field];
      }
    }

    // Обновляем время изменения
    bot.updatedAt = new Date().toISOString();

    // Сохраняем обновленного бота
    await fs.writeFile(botPath, JSON.stringify(bot, null, 2));

    res.json({
      success: true,
      message: 'Бот успешно обновлен',
      data: bot
    });

  } catch (error) {
    console.error('Ошибка обновления бота:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка обновления бота'
    });
  }
});

// DELETE /api/bots/:id - удаление бота
router.delete('/:id', async (req, res) => {
  try {
    const botId = req.params.id;
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    // Загружаем бота для получения токена
    const botData = await fs.readFile(botPath, 'utf8');
    const bot = JSON.parse(botData);

    // Авторизация отключена - пропускаем проверку доступа

    // Освобождаем токен
    await tokenManager.releaseToken(bot.token);

    // Удаляем файл бота
    await fs.unlink(botPath);

    res.json({
      success: true,
      message: 'Бот успешно удален'
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      return res.status(404).json({
        success: false,
        error: 'Бот не найден'
      });
    }

    console.error('Ошибка удаления бота:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка удаления бота'
    });
  }
});

// POST /api/bots/:id/start - запуск бота
router.post('/:id/start', async (req, res) => {
  try {
    const botId = req.params.id;
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    // Загружаем бота
    const botData = await fs.readFile(botPath, 'utf8');
    const bot = JSON.parse(botData);

    // Авторизация отключена - пропускаем проверку доступа

    // Обновляем статус
    bot.status = 'active';
    bot.updatedAt = new Date().toISOString();

    // Сохраняем изменения
    await fs.writeFile(botPath, JSON.stringify(bot, null, 2));

    res.json({
      success: true,
      message: 'Бот успешно запущен',
      data: bot
    });

  } catch (error) {
    console.error('Ошибка запуска бота:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка запуска бота'
    });
  }
});

// POST /api/bots/:id/stop - остановка бота
router.post('/:id/stop', async (req, res) => {
  try {
    const botId = req.params.id;
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    // Загружаем бота
    const botData = await fs.readFile(botPath, 'utf8');
    const bot = JSON.parse(botData);

    // Авторизация отключена - пропускаем проверку доступа

    // Обновляем статус
    bot.status = 'inactive';
    bot.updatedAt = new Date().toISOString();

    // Сохраняем изменения
    await fs.writeFile(botPath, JSON.stringify(bot, null, 2));

    res.json({
      success: true,
      message: 'Бот успешно остановлен',
      data: bot
    });

  } catch (error) {
    console.error('Ошибка остановки бота:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка остановки бота'
    });
  }
});

// Вспомогательная функция для создания базовой визуальной схемы
async function createDefaultVisualSchema(botId, botName, templateId) {
  try {
    const { v4: uuidv4 } = require('uuid');
    const schemaId = uuidv4();
    const userId = 'admin'; // Авторизация отключена
    
    const defaultSchema = {
      id: schemaId,
      name: `${botName} - Схема`,
      botId: botId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      nodes: [
        {
          id: 'start',
          type: 'start',
          position: { x: 100, y: 100 },
          data: {
            label: 'Начало'
          }
        },
        {
          id: 'welcome',
          type: 'message',
          position: { x: 300, y: 100 },
          data: {
            label: 'Приветствие',
            message: 'Привет! Я ваш новый бот.'
          }
        }
      ],
      connections: [
        {
          id: 'start-welcome',
          source: 'start',
          target: 'welcome'
        }
      ],
      viewport: { x: 0, y: 0, scale: 1 }
    };

    // Если указан шаблон, загружаем его
    if (templateId) {
      // TODO: Загрузить схему из шаблона
    }

    // Сохраняем схему
    const userSchemasDir = path.join(__dirname, '..', 'data', 'visual_schemas', userId);
    await fs.mkdir(userSchemasDir, { recursive: true });
    const schemaPath = path.join(userSchemasDir, `${schemaId}.json`);
    await fs.writeFile(schemaPath, JSON.stringify(defaultSchema, null, 2));

    // Связываем схему с ботом
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    const botData = await fs.readFile(botPath, 'utf8');
    const bot = JSON.parse(botData);
    bot.visualSchemaId = schemaId;
    await fs.writeFile(botPath, JSON.stringify(bot, null, 2));

    console.log(`Создана базовая схема ${schemaId} для бота ${botId}`);
  } catch (error) {
    console.error('Ошибка создания базовой схемы:', error);
  }
}

module.exports = router;