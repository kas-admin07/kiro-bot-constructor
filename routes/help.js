const express = require('express');
const router = express.Router();

// GET /api/help - получение справочной информации
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Справка по API',
      version: '1.0.0',
      endpoints: [
        {
          path: '/api/bots',
          method: 'GET',
          description: 'Получить список всех ботов'
        },
        {
          path: '/api/bots/:id',
          method: 'GET',
          description: 'Получить информацию о конкретном боте'
        },
        {
          path: '/api/bots',
          method: 'POST',
          description: 'Создать нового бота'
        },
        {
          path: '/api/bots/:id',
          method: 'PUT',
          description: 'Обновить бота'
        },
        {
          path: '/api/bots/:id',
          method: 'DELETE',
          description: 'Удалить бота'
        }
      ]
    }
  });
});

module.exports = router;