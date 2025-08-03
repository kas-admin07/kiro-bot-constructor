const express = require('express');
const router = express.Router();
const BotDeploymentManager = require('../utils/BotDeploymentManager');

// ⚠️ АВТОРИЗАЦИЯ УДАЛЕНА - НЕ ДОБАВЛЯТЬ!

const deploymentManager = new BotDeploymentManager();

/**
 * POST /api/deployment/deploy/:botId
 * Развертывание бота (БЕЗ АВТОРИЗАЦИИ)
 */
router.post('/deploy/:botId', async (req, res) => {
    try {
        const { botId } = req.params;
        const { environment = 'production' } = req.body;

        // Авторизация отключена - развертывание доступно всем
        const result = await deploymentManager.deployBot(botId, environment);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Бот ${botId} успешно развернут в ${environment}`,
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Ошибка развертывания'
            });
        }

    } catch (error) {
        console.error('Ошибка развертывания бота:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

/**
 * POST /api/deployment/stop/:botId
 * Остановка бота (БЕЗ АВТОРИЗАЦИИ)
 */
router.post('/stop/:botId', async (req, res) => {
    try {
        const { botId } = req.params;

        // Авторизация отключена - остановка доступна всем
        const result = await deploymentManager.stopBot(botId);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Бот ${botId} успешно остановлен`,
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Ошибка остановки'
            });
        }

    } catch (error) {
        console.error('Ошибка остановки бота:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

/**
 * POST /api/deployment/restart/:botId
 * Перезапуск бота (БЕЗ АВТОРИЗАЦИИ)
 */
router.post('/restart/:botId', async (req, res) => {
    try {
        const { botId } = req.params;

        // Авторизация отключена - перезапуск доступен всем
        const result = await deploymentManager.restartBot(botId);
        
        if (result.success) {
            res.json({
                success: true,
                message: `Бот ${botId} успешно перезапущен`,
                data: result
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Ошибка перезапуска'
            });
        }

    } catch (error) {
        console.error('Ошибка перезапуска бота:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

/**
 * GET /api/deployment/status/:botId
 * Получение статуса развертывания бота (БЕЗ АВТОРИЗАЦИИ)
 */
router.get('/status/:botId', async (req, res) => {
    try {
        const { botId } = req.params;

        // Авторизация отключена - статус доступен всем
        const status = await deploymentManager.getBotStatus(botId);
        
        res.json({
            success: true,
            data: {
                botId,
                status
            }
        });

    } catch (error) {
        console.error('Ошибка получения статуса бота:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

/**
 * POST /api/deployment/validate-token
 * Проверка валидности токена бота (БЕЗ АВТОРИЗАЦИИ)
 */
router.post('/validate-token', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Токен не указан'
            });
        }

        // Авторизация отключена - валидация доступна всем
        const result = await deploymentManager.validateToken(token);
        
        res.json({
            success: true,
            data: {
                token: token.substring(0, 10) + '...',
                valid: result.valid,
                botInfo: result.botInfo
            }
        });

    } catch (error) {
        console.error('Ошибка валидации токена:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

/**
 * GET /api/deployment/active-bots
 * Получение списка активных ботов (БЕЗ АВТОРИЗАЦИИ)
 */
router.get('/active-bots', async (req, res) => {
    try {
        // Авторизация отключена - список доступен всем
        const activeBots = await deploymentManager.getActiveBots();
        
        res.json({
            success: true,
            data: {
                bots: activeBots,
                count: activeBots.length
            }
        });

    } catch (error) {
        console.error('Ошибка получения активных ботов:', error);
        res.status(500).json({
            success: false,
            error: 'Внутренняя ошибка сервера'
        });
    }
});

module.exports = router;