const express = require('express');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const router = express.Router();

// Экспорт бота в Python код
router.post('/:botId/python', async (req, res) => {
  try {
    const { botId } = req.params;
    const { options = {} } = req.body;
    
    // Загружаем бота
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    if (!fs.existsSync(botPath)) {
      return res.status(404).json({
        success: false,
        error: 'Бот не найден'
      });
    }
    
    const botData = JSON.parse(fs.readFileSync(botPath, 'utf8'));
    
    // Экспортируем в Python
    const exportResult = exportBotToPython(botData, options);
    
    if (!exportResult.success) {
      return res.status(500).json({
        success: false,
        error: exportResult.error
      });
    }
    
    // Создаем временную директорию для экспорта
    const tempDir = path.join(__dirname, '..', 'temp', `export_python_${botId}_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Записываем файлы
    exportResult.files.forEach(file => {
      const filePath = path.join(tempDir, file.path);
      fs.writeFileSync(filePath, file.content);
    });
    
    // Создаем ZIP архив
    const zipPath = path.join(tempDir, `${botData.name || botId}-python.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      // Отправляем архив
      res.download(zipPath, `${botData.name || botId}-python.zip`, (err) => {
        if (err) {
          console.error('Ошибка отправки архива:', err);
        }
        
        // Очищаем временные файлы
        setTimeout(() => {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (cleanupError) {
            console.error('Ошибка очистки временных файлов:', cleanupError);
          }
        }, 5000);
      });
    });
    
    archive.on('error', (err) => {
      console.error('Ошибка создания архива:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка создания архива'
      });
    });
    
    archive.pipe(output);
    
    // Добавляем файлы в архив
    exportResult.files.forEach(file => {
      archive.append(file.content, { name: file.path });
    });
    
    archive.finalize();
    
  } catch (error) {
    console.error('Ошибка экспорта в Python:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Экспорт бота в Node.js код
router.post('/:botId/nodejs', async (req, res) => {
  try {
    const { botId } = req.params;
    const { options = {} } = req.body;
    
    // Загружаем бота
    const botPath = path.join(__dirname, '..', 'data', 'bots', `bot_${botId}.json`);
    
    if (!fs.existsSync(botPath)) {
      return res.status(404).json({
        success: false,
        error: 'Бот не найден'
      });
    }
    
    const botData = JSON.parse(fs.readFileSync(botPath, 'utf8'));
    
    // Экспортируем (пока простая реализация без TypeScript)
    const exportResult = exportBotToNodeJS(botData, options);
    
    if (!exportResult.success) {
      return res.status(500).json({
        success: false,
        error: exportResult.error
      });
    }
    
    // Создаем временную директорию для экспорта
    const tempDir = path.join(__dirname, '..', 'temp', `export_${botId}_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Записываем файлы
    exportResult.files.forEach(file => {
      const filePath = path.join(tempDir, file.path);
      fs.writeFileSync(filePath, file.content);
    });
    
    // Создаем ZIP архив
    const zipPath = path.join(tempDir, `${botData.name || botId}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      // Отправляем архив
      res.download(zipPath, `${botData.name || botId}.zip`, (err) => {
        if (err) {
          console.error('Ошибка отправки архива:', err);
        }
        
        // Очищаем временные файлы
        setTimeout(() => {
          try {
            fs.rmSync(tempDir, { recursive: true, force: true });
          } catch (cleanupError) {
            console.error('Ошибка очистки временных файлов:', cleanupError);
          }
        }, 5000);
      });
    });
    
    archive.on('error', (err) => {
      console.error('Ошибка создания архива:', err);
      res.status(500).json({
        success: false,
        error: 'Ошибка создания архива'
      });
    });
    
    archive.pipe(output);
    
    // Добавляем файлы в архив
    exportResult.files.forEach(file => {
      archive.append(file.content, { name: file.path });
    });
    
    archive.finalize();
    
  } catch (error) {
    console.error('Ошибка экспорта в Node.js:', error);
    res.status(500).json({
      success: false,
      error: 'Внутренняя ошибка сервера'
    });
  }
});

// Простая реализация экспорта (без TypeScript модуля)
function exportBotToNodeJS(botSchema, options = {}) {
  const defaultOptions = {
    includeComments: true,
    minify: false,
    platform: 'telegram',
    outputDir: './exported-bot'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  try {
    const files = [];
    
    // Генерируем основной файл
    files.push(generateMainFile(botSchema, opts));
    files.push(generatePackageJson(botSchema));
    files.push(generateReadme(botSchema));
    files.push(generateEnvExample());
    files.push(generateConfigFile(botSchema));
    
    return {
      success: true,
      files
    };
  } catch (error) {
    return {
      success: false,
      files: [],
      error: error.message
    };
  }
}

function generateMainFile(botSchema, options) {
  const commandNodes = botSchema.configuration?.nodes?.filter(
    node => node.type === 'trigger-command'
  ) || [];
  
  const commandHandlers = commandNodes.map(node => {
    const command = node.data.command;
    const handlerName = sanitizeHandlerName(command);
    const connectedActions = getConnectedActions(botSchema, node.id);
    
    return `
bot.onText(/${command.replace('/', '\\/')}/,  async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  console.log(\`📨 Команда ${command} от пользователя \${userId}\`);
  
  try {
${connectedActions.map(action => generateActionCode(action)).join('\n')}
  } catch (error) {
    console.error('Ошибка обработки команды ${command}:', error);
    bot.sendMessage(chatId, 'Произошла ошибка при обработке команды.');
  }
});`;
  }).join('\n');
  
  const mainCode = `${options.includeComments ? generateFileHeader(botSchema) : ''}
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');

// Загружаем конфигурацию
const config = require('./config.json');

// Создаем бота
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

// Состояние пользователей
const userStates = new Map();

// Переменные бота
const botVariables = ${JSON.stringify(botSchema.configuration?.variables || {}, null, 2)};

${options.includeComments ? '// Обработчики команд' : ''}
${commandHandlers}

${options.includeComments ? '// Вспомогательные функции' : ''}
function updateUserState(userId) {
  if (!userStates.has(userId)) {
    userStates.set(userId, {
      messageCount: 0,
      lastActivity: new Date(),
      variables: new Map()
    });
  }
  
  const state = userStates.get(userId);
  state.messageCount++;
  state.lastActivity = new Date();
}

function replaceVariables(text, userId) {
  let result = text;
  
  // Заменяем глобальные переменные
  for (const [key, variable] of Object.entries(botVariables)) {
    const placeholder = \`{{\${key}}}\`;
    result = result.replace(new RegExp(placeholder, 'g'), variable.defaultValue);
  }
  
  // Заменяем пользовательские переменные
  const userState = userStates.get(userId);
  if (userState) {
    result = result.replace(/{{message_count}}/g, userState.messageCount);
    result = result.replace(/{{user_count}}/g, userStates.size);
  }
  
  return result;
}

${options.includeComments ? '// Запуск бота' : ''}
console.log('🤖 Бот запущен!');
console.log('Название:', config.name);
console.log('Описание:', config.description);

bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
});

process.on('SIGINT', () => {
  console.log('\\n🛑 Остановка бота...');
  bot.stopPolling();
  process.exit(0);
});
`;

  return {
    path: 'index.js',
    content: mainCode,
    type: 'js'
  };
}

function generateFileHeader(botSchema) {
  return `/**
 * ${botSchema.name}
 * ${botSchema.description}
 * 
 * Сгенерировано автоматически из конструктора ботов
 * Дата: ${new Date().toLocaleString('ru-RU')}
 */

`;
}

function getConnectedActions(botSchema, nodeId) {
  const edges = botSchema.configuration?.edges || [];
  const nodes = botSchema.configuration?.nodes || [];
  
  return edges
    .filter(edge => edge.source === nodeId)
    .map(edge => nodes.find(node => node.id === edge.target))
    .filter(Boolean);
}

function generateActionCode(action) {
  switch (action.type) {
    case 'action-send-message':
      return `    // Отправляем сообщение: ${action.data.label}
    updateUserState(userId);
    const message = replaceVariables(\`${action.data.text}\`, userId);
    await bot.sendMessage(chatId, message, { 
      parse_mode: '${action.data.parseMode || 'HTML'}' 
    });
    console.log('✅ Отправлено сообщение');`;

    default:
      return `    // Неизвестное действие: ${action.type}
    console.warn('Неподдерживаемое действие:', '${action.type}');`;
  }
}

function sanitizeHandlerName(command) {
  return command.replace(/[^a-zA-Z0-9]/g, '').replace(/^./, str => str.toUpperCase());
}

function generatePackageJson(botSchema) {
  const packageJson = {
    name: botSchema.id || 'exported-bot',
    version: '1.0.0',
    description: botSchema.description || 'Экспортированный бот из конструктора',
    main: 'index.js',
    scripts: {
      start: 'node index.js',
      dev: 'nodemon index.js'
    },
    dependencies: {
      'node-telegram-bot-api': '^0.61.0'
    },
    devDependencies: {
      nodemon: '^2.0.22'
    },
    keywords: ['telegram', 'bot', 'chatbot'],
    author: 'Bot Constructor',
    license: 'MIT'
  };

  return {
    path: 'package.json',
    content: JSON.stringify(packageJson, null, 2),
    type: 'json'
  };
}

function generateReadme(botSchema) {
  const commands = botSchema.configuration?.nodes
    ?.filter(node => node.type === 'trigger-command')
    ?.map(node => `- \`${node.data.command}\` - ${node.data.description || node.data.label}`)
    ?.join('\n') || 'Команды не найдены';

  const readme = `# ${botSchema.name}

${botSchema.description}

## 🚀 Быстрый старт

### 1. Установка зависимостей
\`\`\`bash
npm install
\`\`\`

### 2. Настройка
Скопируйте \`.env.example\` в \`.env\` и заполните токен бота:
\`\`\`bash
cp .env.example .env
\`\`\`

### 3. Запуск
\`\`\`bash
npm start
\`\`\`

## 📋 Команды бота

${commands}

## 🔧 Настройка

Получите токен бота у @BotFather в Telegram и добавьте его в файл \`.env\`.

Дата экспорта: ${new Date().toLocaleString('ru-RU')}
`;

  return {
    path: 'README.md',
    content: readme,
    type: 'md'
  };
}

function generateEnvExample() {
  return {
    path: '.env.example',
    content: `# Токен Telegram бота (получите у @BotFather)
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Режим разработки
NODE_ENV=production
`,
    type: 'txt'
  };
}

function generateConfigFile(botSchema) {
  const config = {
    name: botSchema.name,
    description: botSchema.description,
    version: '1.0.0',
    exported: new Date().toISOString(),
    variables: botSchema.configuration?.variables || {}
  };

  return {
    path: 'config.json',
    content: JSON.stringify(config, null, 2),
    type: 'json'
  };
}

// Функция экспорта в Python
function exportBotToPython(botSchema, options = {}) {
  const defaultOptions = {
    includeComments: true,
    useAsyncio: true,
    framework: 'pyTelegramBotAPI'
  };
  
  const opts = { ...defaultOptions, ...options };
  
  try {
    const files = [];
    
    files.push(generateMainPythonFile(botSchema, opts));
    files.push(generateRequirementsTxt(botSchema));
    files.push(generatePythonReadme(botSchema));
    files.push(generatePythonEnvFile());
    files.push(generatePythonConfig(botSchema));
    files.push(generateRunScript());
    
    return {
      success: true,
      files
    };
  } catch (error) {
    return {
      success: false,
      files: [],
      error: error.message
    };
  }
}

function generateMainPythonFile(botSchema, options) {
  const commandNodes = botSchema.configuration?.nodes?.filter(
    node => node.type === 'trigger-command'
  ) || [];
  
  const commandHandlers = commandNodes.map(node => {
    const command = node.data.command.replace('/', '');
    const connectedActions = getConnectedActions(botSchema, node.id);
    
    return `
@bot.message_handler(commands=['${command}'])
def handle_${command}(message):
    """Обработчик команды /${command}"""
    chat_id = message.chat.id
    user_id = message.from_user.id
    
    logger.info(f"📨 Команда /${command} от пользователя {user_id}")
    
    try:
        update_user_state(user_id)
        
${connectedActions.map(action => generatePythonActionCode(action)).join('\n')}
        
    except Exception as e:
        logger.error(f"Ошибка обработки команды /${command}: {e}")
        bot.send_message(chat_id, "Произошла ошибка при обработке команды.")`;
  }).join('\n');
  
  const mainCode = `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
${botSchema.name}
${botSchema.description}

Сгенерировано автоматически из конструктора ботов
Дата: ${new Date().toLocaleString('ru-RU')}
"""

import os
import json
import logging
from datetime import datetime
from collections import defaultdict

import telebot

# Настройка логирования
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Загружаем конфигурацию
with open('config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# Создаем бота
bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
if not bot_token:
    raise ValueError("TELEGRAM_BOT_TOKEN не установлен")

bot = telebot.TeleBot(bot_token)

# Состояние пользователей
user_states = defaultdict(lambda: {'message_count': 0, 'last_activity': datetime.now()})

# Переменные бота
bot_variables = ${JSON.stringify(botSchema.configuration?.variables || {}, null, 4).replace(/"/g, "'")}

start_time = datetime.now()

${commandHandlers}

def update_user_state(user_id):
    """Обновляет состояние пользователя"""
    state = user_states[user_id]
    state['message_count'] += 1
    state['last_activity'] = datetime.now()

def replace_variables(text, user_id):
    """Заменяет переменные в тексте"""
    result = text
    
    for key, variable in bot_variables.items():
        placeholder = f"{{{{{key}}}}}"
        result = result.replace(placeholder, str(variable.get('defaultValue', '')))
    
    state = user_states[user_id]
    result = result.replace('{{message_count}}', str(state['message_count']))
    result = result.replace('{{user_count}}', str(len(user_states)))
    
    uptime = datetime.now() - start_time
    result = result.replace('{{uptime}}', f"{uptime.seconds // 3600} часов")
    
    return result

def main():
    """Основная функция запуска бота"""
    logger.info("🤖 Бот запущен!")
    logger.info(f"Название: {config['name']}")
    
    try:
        bot.polling(none_stop=True)
    except KeyboardInterrupt:
        logger.info("🛑 Остановка бота...")
    finally:
        bot.stop_polling()

if __name__ == '__main__':
    main()
`;

  return {
    path: 'main.py',
    content: mainCode,
    type: 'py'
  };
}

function generatePythonActionCode(action) {
  switch (action.type) {
    case 'action-send-message':
      return `        message_text = replace_variables("""${action.data.text}""", user_id)
        bot.send_message(chat_id, message_text, parse_mode='${action.data.parseMode || 'HTML'}')
        logger.info("✅ Отправлено сообщение")`;

    default:
      return `        logger.warning(f"Неподдерживаемое действие: ${action.type}")`;
  }
}

function generateRequirementsTxt(botSchema) {
  return {
    path: 'requirements.txt',
    content: `pyTelegramBotAPI==4.14.0
python-dotenv==1.0.0
requests==2.31.0
`,
    type: 'txt'
  };
}

function generatePythonReadme(botSchema) {
  const commands = botSchema.configuration?.nodes
    ?.filter(node => node.type === 'trigger-command')
    ?.map(node => `- \`${node.data.command}\` - ${node.data.description || node.data.label}`)
    ?.join('\n') || 'Команды не найдены';

  return {
    path: 'README.md',
    content: `# ${botSchema.name}

${botSchema.description}

## 🚀 Быстрый старт

### 1. Установка зависимостей
\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 2. Настройка
\`\`\`bash
cp .env.example .env
# Отредактируйте .env и добавьте токен бота
\`\`\`

### 3. Запуск
\`\`\`bash
python main.py
\`\`\`

## 📋 Команды бота

${commands}

Дата экспорта: ${new Date().toLocaleString('ru-RU')}
`,
    type: 'md'
  };
}

function generatePythonEnvFile() {
  return {
    path: '.env.example',
    content: `TELEGRAM_BOT_TOKEN=your_bot_token_here
LOG_LEVEL=INFO
`,
    type: 'txt'
  };
}

function generatePythonConfig(botSchema) {
  return {
    path: 'config.json',
    content: JSON.stringify({
      name: botSchema.name,
      description: botSchema.description,
      version: '1.0.0',
      exported: new Date().toISOString()
    }, null, 2),
    type: 'json'
  };
}

function generateRunScript() {
  return {
    path: 'run.bat',
    content: `@echo off
echo 🤖 Запуск Python бота...
python main.py
pause
`,
    type: 'bat'
  };
}

module.exports = router;