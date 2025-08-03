/**
 * API роуты для управления интеграциями
 */
const express = require('express');
const router = express.Router();

// Временная заглушка для IntegrationManager (будет заменена на реальную реализацию)
class IntegrationManager {
  constructor() {
    this.integrations = new Map();
    this.usage = new Map();
    this.initializeDefaultIntegrations();
  }

  static getInstance() {
    if (!IntegrationManager.instance) {
      IntegrationManager.instance = new IntegrationManager();
    }
    return IntegrationManager.instance;
  }

  initializeDefaultIntegrations() {
    const defaultIntegrations = [
      {
        id: 'rest-api-default',
        name: 'REST API по умолчанию',
        type: 'rest_api',
        enabled: true,
        config: {
          timeout: 10000,
          retries: 2
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'csv-parser',
        name: 'CSV парсер',
        type: 'csv_parser',
        enabled: true,
        config: {
          delimiter: ',',
          hasHeader: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'web-scraping',
        name: 'Веб-скрапинг',
        type: 'web_scraping',
        enabled: true,
        config: {
          timeout: 15000,
          userAgent: 'Bot-Constructor/1.0'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    defaultIntegrations.forEach(integration => {
      this.integrations.set(integration.id, integration);
      this.usage.set(integration.id, {
        integrationId: integration.id,
        requests: Math.floor(Math.random() * 100),
        lastUsed: Date.now() - Math.floor(Math.random() * 86400000),
        errors: Math.floor(Math.random() * 5),
        avgResponseTime: Math.floor(Math.random() * 1000) + 100
      });
    });
  }

  getAllIntegrations() {
    return Array.from(this.integrations.values());
  }

  getIntegration(id) {
    return this.integrations.get(id);
  }

  getIntegrationsByType(type) {
    return Array.from(this.integrations.values())
      .filter(integration => integration.type === type);
  }

  addIntegration(integration) {
    this.integrations.set(integration.id, integration);
    this.usage.set(integration.id, {
      integrationId: integration.id,
      requests: 0,
      lastUsed: 0,
      errors: 0,
      avgResponseTime: 0
    });
    return true;
  }

  updateIntegration(id, updates) {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    const updatedIntegration = {
      ...integration,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.integrations.set(id, updatedIntegration);
    return true;
  }

  removeIntegration(id) {
    const removed = this.integrations.delete(id);
    if (removed) {
      this.usage.delete(id);
    }
    return removed;
  }

  getUsageStats(integrationId) {
    if (integrationId) {
      const usage = this.usage.get(integrationId);
      return usage ? [usage] : [];
    }
    return Array.from(this.usage.values());
  }

  getOverallStats() {
    const integrations = this.getAllIntegrations();
    const usageStats = this.getUsageStats();

    const totalRequests = usageStats.reduce((sum, usage) => sum + usage.requests, 0);
    const totalErrors = usageStats.reduce((sum, usage) => sum + usage.errors, 0);
    const avgResponseTime = usageStats.length > 0 
      ? usageStats.reduce((sum, usage) => sum + usage.avgResponseTime, 0) / usageStats.length 
      : 0;

    const integrationsByType = {};
    integrations.forEach(integration => {
      integrationsByType[integration.type] = (integrationsByType[integration.type] || 0) + 1;
    });

    return {
      totalIntegrations: integrations.length,
      enabledIntegrations: integrations.filter(i => i.enabled).length,
      totalRequests,
      totalErrors,
      avgResponseTime: Math.round(avgResponseTime),
      integrationsByType
    };
  }

  async testIntegration(integrationId) {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      return {
        success: false,
        responseTime: 0,
        error: 'Интеграция не найдена'
      };
    }

    // Симуляция тестирования
    const responseTime = Math.floor(Math.random() * 1000) + 100;
    const success = Math.random() > 0.2; // 80% успешных тестов

    return {
      success,
      responseTime,
      error: success ? undefined : 'Тестовая ошибка подключения',
      data: success ? { status: 'ok', timestamp: new Date().toISOString() } : undefined
    };
  }
}

const integrationManager = IntegrationManager.getInstance();

/**
 * GET /api/integrations
 * Получить все интеграции
 */
router.get('/', async (req, res) => {
  try {
    const { type, enabled } = req.query;
    
    let integrations = integrationManager.getAllIntegrations();
    
    // Фильтрация по типу
    if (type) {
      integrations = integrations.filter(integration => integration.type === type);
    }
    
    // Фильтрация по статусу
    if (enabled !== undefined) {
      const isEnabled = enabled === 'true';
      integrations = integrations.filter(integration => integration.enabled === isEnabled);
    }

    res.json({
      success: true,
      integrations,
      total: integrations.length
    });
  } catch (error) {
    console.error('Error getting integrations:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения интеграций'
    });
  }
});

/**
 * GET /api/integrations/types
 * Получить доступные типы интеграций
 */
router.get('/types', async (req, res) => {
  try {
    const types = [
      {
        id: 'rest_api',
        name: 'REST API',
        description: 'HTTP REST API интеграции',
        icon: '🌐',
        configFields: ['url', 'method', 'headers', 'timeout']
      },
      {
        id: 'graphql',
        name: 'GraphQL',
        description: 'GraphQL API интеграции',
        icon: '📊',
        configFields: ['endpoint', 'query', 'variables']
      },
      {
        id: 'database',
        name: 'База данных',
        description: 'Подключение к базам данных',
        icon: '🗄️',
        configFields: ['host', 'database', 'username', 'password']
      },
      {
        id: 'web_scraping',
        name: 'Веб-скрапинг',
        description: 'Извлечение данных с веб-страниц',
        icon: '🕷️',
        configFields: ['url', 'selector', 'attribute']
      },
      {
        id: 'csv_parser',
        name: 'CSV парсер',
        description: 'Парсинг CSV файлов',
        icon: '📄',
        configFields: ['delimiter', 'hasHeader', 'encoding']
      },
      {
        id: 'xml_parser',
        name: 'XML парсер',
        description: 'Парсинг XML данных',
        icon: '📋',
        configFields: ['xpath', 'namespace']
      },
      {
        id: 'file_storage',
        name: 'Файловое хранилище',
        description: 'Работа с файлами',
        icon: '📁',
        configFields: ['basePath', 'allowedExtensions', 'maxFileSize']
      }
    ];

    res.json({
      success: true,
      types
    });
  } catch (error) {
    console.error('Error getting integration types:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения типов интеграций'
    });
  }
});

/**
 * GET /api/integrations/stats
 * Получить статистику интеграций
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = integrationManager.getOverallStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting integration stats:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики'
    });
  }
});

/**
 * GET /api/integrations/:id
 * Получить конкретную интеграцию
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const integration = integrationManager.getIntegration(id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Интеграция не найдена'
      });
    }

    // Получаем статистику использования
    const usage = integrationManager.getUsageStats(id);

    res.json({
      success: true,
      integration,
      usage: usage[0] || null
    });
  } catch (error) {
    console.error('Error getting integration:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения интеграции'
    });
  }
});

/**
 * POST /api/integrations
 * Создать новую интеграцию
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, config, enabled = true, timeout, retries, rateLimit } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        error: 'Название и тип интеграции обязательны'
      });
    }

    const integration = {
      id: `integration_${Date.now()}`,
      name,
      type,
      enabled,
      config: config || {},
      timeout,
      retries,
      rateLimit,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const success = integrationManager.addIntegration(integration);
    
    if (success) {
      res.json({
        success: true,
        integration,
        message: 'Интеграция создана успешно'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Ошибка создания интеграции'
      });
    }
  } catch (error) {
    console.error('Error creating integration:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка создания интеграции'
    });
  }
});

/**
 * PUT /api/integrations/:id
 * Обновить интеграцию
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const success = integrationManager.updateIntegration(id, updates);
    
    if (success) {
      const updatedIntegration = integrationManager.getIntegration(id);
      res.json({
        success: true,
        integration: updatedIntegration,
        message: 'Интеграция обновлена успешно'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Интеграция не найдена'
      });
    }
  } catch (error) {
    console.error('Error updating integration:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка обновления интеграции'
    });
  }
});

/**
 * DELETE /api/integrations/:id
 * Удалить интеграцию
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const success = integrationManager.removeIntegration(id);
    
    if (success) {
      res.json({
        success: true,
        message: 'Интеграция удалена успешно'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Интеграция не найдена'
      });
    }
  } catch (error) {
    console.error('Error deleting integration:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка удаления интеграции'
    });
  }
});

/**
 * POST /api/integrations/:id/test
 * Тестировать интеграцию
 */
router.post('/:id/test', async (req, res) => {
  try {
    const { id } = req.params;
    const testResult = await integrationManager.testIntegration(id);
    
    res.json({
      success: true,
      testResult
    });
  } catch (error) {
    console.error('Error testing integration:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка тестирования интеграции'
    });
  }
});

/**
 * GET /api/integrations/:id/usage
 * Получить статистику использования интеграции
 */
router.get('/:id/usage', async (req, res) => {
  try {
    const { id } = req.params;
    const usage = integrationManager.getUsageStats(id);
    
    if (usage.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Статистика не найдена'
      });
    }

    res.json({
      success: true,
      usage: usage[0]
    });
  } catch (error) {
    console.error('Error getting integration usage:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения статистики использования'
    });
  }
});

/**
 * POST /api/integrations/:id/toggle
 * Включить/выключить интеграцию
 */
router.post('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const integration = integrationManager.getIntegration(id);
    
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Интеграция не найдена'
      });
    }

    const success = integrationManager.updateIntegration(id, {
      enabled: !integration.enabled
    });
    
    if (success) {
      const updatedIntegration = integrationManager.getIntegration(id);
      res.json({
        success: true,
        integration: updatedIntegration,
        message: `Интеграция ${updatedIntegration.enabled ? 'включена' : 'выключена'}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Ошибка переключения интеграции'
      });
    }
  } catch (error) {
    console.error('Error toggling integration:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка переключения интеграции'
    });
  }
});

module.exports = router;