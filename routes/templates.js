/**
 * API роуты для работы с шаблонами ботов
 */
const express = require('express');
const router = express.Router();

// Временная заглушка для TemplateService (будет заменена на реальную реализацию)
class TemplateService {
  async getAllTemplates() {
    return [
      {
        id: 'welcome-bot',
        name: 'Приветственный бот',
        description: 'Простой бот для приветствия новых пользователей',
        category: 'business',
        tags: ['приветствие', 'начинающий'],
        difficulty: 'beginner',
        platforms: ['telegram', 'discord'],
        preview: {
          features: ['Приветствие пользователей', 'Базовые команды', 'Справочная система']
        },
        author: 'Bot Constructor Team',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'faq-bot',
        name: 'FAQ бот',
        description: 'Бот для автоматических ответов на частые вопросы',
        category: 'support',
        tags: ['faq', 'поддержка'],
        difficulty: 'intermediate',
        platforms: ['telegram'],
        preview: {
          features: ['Автоответы на FAQ', 'База знаний', 'Эскалация к операторам']
        },
        author: 'Bot Constructor Team',
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  async getTemplate(id) {
    const templates = await this.getAllTemplates();
    return templates.find(t => t.id === id) || null;
  }

  async getTemplatesByCategory(category) {
    const templates = await this.getAllTemplates();
    return templates.filter(t => t.category === category);
  }

  async searchTemplates(query, filters = {}) {
    let templates = await this.getAllTemplates();
    
    if (query) {
      const searchQuery = query.toLowerCase();
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery) ||
        t.description.toLowerCase().includes(searchQuery) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery))
      );
    }

    if (filters.category) {
      templates = templates.filter(t => t.category === filters.category);
    }

    if (filters.difficulty) {
      templates = templates.filter(t => t.difficulty === filters.difficulty);
    }

    if (filters.platform) {
      templates = templates.filter(t => t.platforms.includes(filters.platform));
    }

    return templates;
  }

  async getCategories() {
    return [
      {
        id: 'business',
        name: 'Бизнес',
        description: 'Шаблоны для бизнес-процессов',
        icon: '💼',
        templates: []
      },
      {
        id: 'support',
        name: 'Поддержка',
        description: 'Боты для клиентской поддержки',
        icon: '🎧',
        templates: []
      },
      {
        id: 'education',
        name: 'Образование',
        description: 'Обучающие боты и квизы',
        icon: '📚',
        templates: []
      },
      {
        id: 'ecommerce',
        name: 'Электронная коммерция',
        description: 'Боты для интернет-магазинов',
        icon: '🛒',
        templates: []
      }
    ];
  }

  async createBotFromTemplate(templateId, botName) {
    const template = await this.getTemplate(templateId);
    if (!template) return null;

    return {
      id: `bot_${Date.now()}`,
      name: botName,
      nodes: template.schema?.nodes || [],
      edges: template.schema?.edges || [],
      variables: template.schema?.variables || {},
      settings: {
        ...template.schema?.settings,
        name: botName
      },
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}

const templateService = new TemplateService();

/**
 * GET /api/templates
 * Получить все шаблоны
 */
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, platform, search } = req.query;
    
    let templates;
    if (search) {
      templates = await templateService.searchTemplates(search, {
        category,
        difficulty,
        platform
      });
    } else {
      templates = await templateService.getAllTemplates();
      
      // Применяем фильтры
      if (category) {
        templates = templates.filter(t => t.category === category);
      }
      if (difficulty) {
        templates = templates.filter(t => t.difficulty === difficulty);
      }
      if (platform) {
        templates = templates.filter(t => t.platforms.includes(platform));
      }
    }

    res.json({
      success: true,
      templates,
      total: templates.length
    });
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения шаблонов'
    });
  }
});

/**
 * GET /api/templates/categories
 * Получить все категории шаблонов
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await templateService.getCategories();
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения категорий'
    });
  }
});

/**
 * GET /api/templates/:id
 * Получить конкретный шаблон
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateService.getTemplate(id);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Шаблон не найден'
      });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка получения шаблона'
    });
  }
});

/**
 * POST /api/templates/:id/clone
 * Создать бота из шаблона
 */
router.post('/:id/clone', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Название бота обязательно'
      });
    }

    const botSchema = await templateService.createBotFromTemplate(id, name);
    
    if (!botSchema) {
      return res.status(404).json({
        success: false,
        error: 'Шаблон не найден'
      });
    }

    res.json({
      success: true,
      message: 'Бот успешно создан из шаблона',
      data: botSchema
    });
  } catch (error) {
    console.error('Error cloning template:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка создания бота из шаблона'
    });
  }
});

module.exports = router;