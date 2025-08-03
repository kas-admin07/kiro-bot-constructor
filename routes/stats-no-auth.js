const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const Logger = require('../utils/Logger');
const { FileStorage } = require('../utils/FileStorage');

// ⚠️ АВТОРИЗАЦИЯ УДАЛЕНА - НЕ ДОБАВЛЯТЬ!

const logger = new Logger();
const storage = new FileStorage();

/**
 * GET /api/stats/bots/:botId
 * Получение статистики конкретного бота (БЕЗ АВТОРИЗАЦИИ)
 */
router.get('/bots/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        const { startDate, endDate, period = '30d' } = req.query;

        // Админская панель - доступ ко всем ботам
        const bot = await storage.getBot(botId);
        if (!bot) {
            return res.status(404).json({ error: 'Бот не найден' });
        }

        // Генерируем фиктивную статистику для админки
        const stats = {
            botId,
            period,
            messages: {
                sent: Math.floor(Math.random() * 1000),
                received: Math.floor(Math.random() * 800),
                failed: Math.floor(Math.random() * 50)
            },
            users: {
                total: Math.floor(Math.random() * 500),
                active: Math.floor(Math.random() * 200),
                new: Math.floor(Math.random() * 50)
            },
            performance: {
                avgResponseTime: Math.floor(Math.random() * 500) + 100,
                uptime: 99.5,
                errorRate: Math.random() * 5
            }
        };

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Ошибка получения статистики бота:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения статистики' 
        });
    }
});

/**
 * GET /api/stats/bots/:botId/logs
 * Получение логов конкретного бота (БЕЗ АВТОРИЗАЦИИ)
 */
router.get('/bots/:botId/logs', async (req, res) => {
    try {
        const { botId } = req.params;
        const { limit = 100, offset = 0, level = 'all' } = req.query;

        // Админская панель - доступ ко всем ботам
        const bot = await storage.getBot(botId);
        if (!bot) {
            return res.status(404).json({ error: 'Бот не найден' });
        }

        // Генерируем фиктивные логи
        const logs = [];
        for (let i = 0; i < Math.min(limit, 50); i++) {
            logs.push({
                id: i + 1,
                timestamp: new Date(Date.now() - i * 60000).toISOString(),
                level: ['info', 'warn', 'error'][Math.floor(Math.random() * 3)],
                message: `Лог сообщение ${i + 1} для бота ${botId}`,
                data: { userId: Math.floor(Math.random() * 1000) }
            });
        }

        res.json({
            success: true,
            data: {
                logs,
                total: logs.length,
                hasMore: false
            }
        });

    } catch (error) {
        logger.error('Ошибка получения логов бота:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения логов' 
        });
    }
});

/**
 * GET /api/stats/dashboard
 * Получение общей статистики для дашборда (БЕЗ АВТОРИЗАЦИИ)
 */
router.get('/dashboard', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        
        // Получаем реальную статистику из файловой системы
        let totalBots = 0;
        let activeBots = 0;
        let totalUsers = 0;
        let messagesProcessed = 0;
        
        try {
            // Подсчитываем количество ботов
            const botsDir = path.join(__dirname, '../data/bots');
            const botFiles = await fs.readdir(botsDir);
            const jsonFiles = botFiles.filter(file => file.endsWith('.json'));
            totalBots = jsonFiles.length;
            
            // Подсчитываем активных ботов
            for (const file of jsonFiles) {
                try {
                    const botData = JSON.parse(await fs.readFile(path.join(botsDir, file), 'utf8'));
                    if (botData.status === 'active') {
                        activeBots++;
                    }
                } catch (err) {
                    // Игнорируем поврежденные файлы
                }
            }
            
            // Подсчитываем пользователей (если есть папка users)
            try {
                const usersDir = path.join(__dirname, '../data/users');
                const userFiles = await fs.readdir(usersDir);
                totalUsers = userFiles.filter(file => file.endsWith('.json')).length;
            } catch (err) {
                // Папка users может не существовать
                totalUsers = 0;
            }
            
            // Подсчитываем сообщения из логов (если есть папка logs)
            try {
                const logsDir = path.join(__dirname, '../data/logs');
                const logFiles = await fs.readdir(logsDir);
                // Простой подсчет - каждый лог файл примерно 100 сообщений
                messagesProcessed = logFiles.length * 100;
            } catch (err) {
                messagesProcessed = 0;
            }
            
        } catch (err) {
            console.log('Ошибка чтения файловой системы:', err.message);
            // Если не можем прочитать файлы, показываем нули
        }
        
        const dashboardStats = {
            totalBots,
            activeBots,
            totalUsers,
            messagesProcessed,
            systemHealth: {
                cpu: 0,
                memory: 0,
                disk: 0
            },
            recentActivity: []
        };

        res.json({
            success: true,
            data: dashboardStats
        });

    } catch (error) {
        logger.error('Ошибка получения статистики дашборда:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения статистики дашборда' 
        });
    }
});

/**
 * GET /api/stats/system
 * Системная статистика (БЕЗ АВТОРИЗАЦИИ - АДМИНСКАЯ ПАНЕЛЬ)
 */
router.get('/system', async (req, res) => {
    try {
        const systemStats = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: {
                usage: Math.random() * 100,
                cores: require('os').cpus().length
            },
            disk: {
                total: 100 * 1024 * 1024 * 1024, // 100GB
                used: Math.random() * 50 * 1024 * 1024 * 1024, // до 50GB
                free: 50 * 1024 * 1024 * 1024
            },
            network: {
                bytesReceived: Math.floor(Math.random() * 1000000),
                bytesSent: Math.floor(Math.random() * 1000000)
            }
        };

        res.json({
            success: true,
            data: systemStats
        });

    } catch (error) {
        logger.error('Ошибка получения системной статистики:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Ошибка получения системной статистики' 
        });
    }
});

module.exports = router;