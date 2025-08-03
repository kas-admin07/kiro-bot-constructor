const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const BotRuntime = require('./utils/BotRuntime');
const { setBotRuntime: setRuntimeForRoutes } = require('./routes/runtime');
const { setBotRuntime: setRuntimeForWebhooks } = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3000;

// Инициализация BotRuntime
const botRuntime = new BotRuntime();
setRuntimeForRoutes(botRuntime);
setRuntimeForWebhooks(botRuntime);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));
app.use('/frontend', express.static(path.join(__dirname, 'frontend')));

// Создание необходимых директорий
const ensureDirectories = () => {
  const dirs = [
    'data',
    'data/bots',
    'data/users',
    'data/sessions',
    'data/visual_schemas',
    'data/visual_schemas/versions',
    'data/templates',
    'data/backups',
    'data/logs'
  ];
  
  dirs.forEach(dir => {
    const dirPath = path.join(__dirname, dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Создана директория: ${dir}`);
    }
  });
};

ensureDirectories();

// API Routes
app.use('/api/bots', require('./routes/bots'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/visual-schemas', require('./routes/visual-schemas'));
app.use('/api/platforms', require('./routes/platforms'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/deployment', require('./routes/deployment-no-auth'));
app.use('/api/runtime', require('./routes/runtime').router);

// Webhook routes
app.use('/webhook', require('./routes/webhooks').router);

// Главная страница - редирект на дашборд
app.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Дашборд
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Редактор ботов
app.get('/editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'editor.html'));
});

// Визуальный редактор
app.get('/visual-editor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'visual-editor.html'));
});

// Страница настроек
app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Страница логов
app.get('/logs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'logs.html'));
});

// Страница развертывания
app.get('/deployment', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'deployment.html'));
});

// Страница интеграций
app.get('/integrations', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'integrations.html'));
});

// Страница платформ
app.get('/platforms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'platforms.html'));
});

// API для получения информации о сервере
app.get('/api/server/info', (req, res) => {
  res.json({
    success: true,
    data: {
      version: '1.1.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      platform: process.platform,
      nodeVersion: process.version,
      activeBots: botRuntime.getActiveBots().length,
      totalRequests: 0 // TODO: добавить счетчик запросов
    }
  });
});

// Обработка ошибок 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Страница не найдена'
  });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Глобальная ошибка:', err);
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера'
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Получен сигнал SIGINT. Завершение работы...');
  
  try {
    // Останавливаем всех ботов
    await botRuntime.stopAllBots();
    console.log('✅ Все боты остановлены');
    
    // Закрываем сервер
    server.close(() => {
      console.log('✅ HTTP сервер закрыт');
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ Ошибка при завершении работы:', error);
    process.exit(1);
  }
});

// Запуск сервера
const server = app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📊 Дашборд: http://localhost:${PORT}/dashboard`);
  console.log(`✏️ Редактор: http://localhost:${PORT}/editor`);
  console.log(`🎨 Визуальный редактор: http://localhost:${PORT}/visual-editor`);
  console.log(`⚙️ Настройки: http://localhost:${PORT}/settings`);
  console.log(`📋 Логи: http://localhost:${PORT}/logs`);
  console.log(`🚀 Развертывание: http://localhost:${PORT}/deployment`);
  console.log(`🔗 Интеграции: http://localhost:${PORT}/integrations`);
  console.log(`📱 Платформы: http://localhost:${PORT}/platforms`);
  
  // Автозагрузка ботов при старте
  botRuntime.autoLoadBots().then(() => {
    console.log('✅ Автозагрузка ботов завершена');
  }).catch(error => {
    console.error('❌ Ошибка автозагрузки ботов:', error);
  });
});

module.exports = app;