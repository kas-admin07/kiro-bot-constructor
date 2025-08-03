const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Получить настройки платформ для бота
router.get('/:botId/platforms', (req, res) => {
  try {
    const { botId } = req.params;
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    if (!fs.existsSync(botPath)) {
      return res.status(404).json({
        success: false,
        error: 'Бот не найден'
      });
    }
    
    const botData = JSON.parse(fs.readFileSync(botPath, 'utf8'));
    const platforms = botData.platforms || [];
    
    res.json({
      success: true,
      platforms
    });
  } catch (error) {
    console.error('Ошибка получения настроек платформ:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Обновить настройки платформ для бота
router.put('/:botId/platforms', (req, res) => {
  try {
    const { botId } = req.params;
    const { platforms } = req.body;
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    if (!fs.existsSync(botPath)) {
      return res.status(404).json({
        success: false,
        error: 'Бот не найден'
      });
    }
    
    const botData = JSON.parse(fs.readFileSync(botPath, 'utf8'));
    botData.platforms = platforms;
    botData.updatedAt = new Date().toISOString();
    
    fs.writeFileSync(botPath, JSON.stringify(botData, null, 2));
    
    res.json({
      success: true,
      message: 'Настройки платформ обновлены'
    });
  } catch (error) {
    console.error('Ошибка обновления настроек платформ:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Тестировать подключение к платформе
router.post('/:botId/platforms/:platform/test', async (req, res) => {
  try {
    const { botId, platform } = req.params;
    const { credentials, mode } = req.body;
    
    // Валидация учетных данных
    if (!credentials || Object.keys(credentials).length === 0) {
      return res.json({
        success: false,
        error: 'Не указаны учетные данные'
      });
    }
    
    let testResult = { success: false, error: 'Неизвестная платформа' };
    
    switch (platform) {
      case 'telegram':
        testResult = await testTelegramConnection(credentials);
        break;
      case 'max':
        testResult = await testMaxConnection(credentials);
        break;
      case 'whatsapp':
        testResult = await testWhatsAppConnection(credentials);
        break;
      case 'discord':
        testResult = await testDiscordConnection(credentials);
        break;
    }
    
    res.json(testResult);
  } catch (error) {
    console.error('Ошибка тестирования подключения:', error);
    res.json({
      success: false,
      error: 'Ошибка тестирования подключения'
    });
  }
});

// Функции тестирования подключений
async function testTelegramConnection(credentials) {
  try {
    const { token } = credentials;
    
    if (!token) {
      return { success: false, error: 'Не указан токен бота' };
    }
    
    // Проверяем формат токена
    if (!/^\d+:[A-Za-z0-9_-]+$/.test(token)) {
      return { success: false, error: 'Неверный формат токена' };
    }
    
    // Тестируем подключение к Telegram API
    const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      return {
        success: true,
        botInfo: {
          id: data.result.id,
          username: data.result.username,
          first_name: data.result.first_name
        }
      };
    } else {
      return {
        success: false,
        error: data.description || 'Ошибка подключения к Telegram API'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: 'Не удалось подключиться к Telegram API'
    };
  }
}

async function testMaxConnection(credentials) {
  try {
    const { apiKey, secretKey } = credentials;
    
    if (!apiKey || !secretKey) {
      return { success: false, error: 'Не указаны API ключи' };
    }
    
    // Здесь должна быть реальная проверка подключения к MAX API
    // Пока возвращаем успешный результат для демонстрации
    return {
      success: true,
      message: 'Подключение к MAX API успешно (демо)'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Не удалось подключиться к MAX API'
    };
  }
}

async function testWhatsAppConnection(credentials) {
  try {
    const { phoneNumberId, accessToken } = credentials;
    
    if (!phoneNumberId || !accessToken) {
      return { success: false, error: 'Не указаны учетные данные WhatsApp' };
    }
    
    // Здесь должна быть реальная проверка подключения к WhatsApp API
    // Пока возвращаем успешный результат для демонстрации
    return {
      success: true,
      message: 'Подключение к WhatsApp API успешно (демо)'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Не удалось подключиться к WhatsApp API'
    };
  }
}

async function testDiscordConnection(credentials) {
  try {
    const { token } = credentials;
    
    if (!token) {
      return { success: false, error: 'Не указан токен бота' };
    }
    
    // Здесь должна быть реальная проверка подключения к Discord API
    // Пока возвращаем успешный результат для демонстрации
    return {
      success: true,
      message: 'Подключение к Discord API успешно (демо)'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Не удалось подключиться к Discord API'
    };
  }
}

// Получить доступные платформы
router.get('/available', (req, res) => {
  const platforms = [
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '📱',
      description: 'Telegram Bot API',
      supportsModes: ['polling', 'webhook'],
      credentialFields: [
        { key: 'token', label: 'Bot Token', type: 'password', required: true }
      ]
    },
    {
      id: 'max',
      name: 'MAX',
      icon: '💬',
      description: 'MAX Messenger API',
      supportsModes: ['polling', 'webhook'],
      credentialFields: [
        { key: 'apiKey', label: 'API Key', type: 'password', required: true },
        { key: 'secretKey', label: 'Secret Key', type: 'password', required: true }
      ]
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: '📞',
      description: 'WhatsApp Business API',
      supportsModes: ['webhook'],
      credentialFields: [
        { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true },
        { key: 'accessToken', label: 'Access Token', type: 'password', required: true }
      ]
    },
    {
      id: 'discord',
      name: 'Discord',
      icon: '🎮',
      description: 'Discord Bot API',
      supportsModes: ['webhook'],
      credentialFields: [
        { key: 'token', label: 'Bot Token', type: 'password', required: true }
      ]
    }
  ];
  
  res.json({
    success: true,
    platforms
  });
});

// Простая реализация fetch для Node.js если не доступна
if (typeof fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
    const https = require('https');
    const http = require('http');
    const urlParsed = new URL(url);
    const client = urlParsed.protocol === 'https:' ? https : http;
    
    return new Promise((resolve, reject) => {
      const req = client.request(url, {
        method: options.method || 'GET',
        headers: options.headers || {}
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: async () => JSON.parse(data),
            text: async () => data
          });
        });
      });
      
      req.on('error', reject);
      
      if (options.body) {
        req.write(options.body);
      }
      
      req.end();
    });
  };
}

module.exports = router;