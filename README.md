# KIRO Bot Constructor 🤖

**Мощный конструктор Telegram ботов с визуальным редактором**

## 🚀 Возможности

### 📊 Дашборд
- Обзор всех ботов
- Статистика использования
- Быстрые действия (запуск/остановка)
- Мониторинг производительности

### ✏️ Редактор ботов
- Создание и редактирование ботов
- Настройка команд и ответов
- Управление сценариями
- Импорт/экспорт конфигураций

### 🎨 Визуальный редактор
- Drag & Drop интерфейс
- Визуальное создание логики бота
- Предварительный просмотр
- Автосохранение

### ⚙️ Настройки
- Конфигурация сервера
- Управление пользователями
- Настройки безопасности
- Резервное копирование

### 📋 Система логирования
- Детальные логи работы
- Фильтрация по уровням
- Экспорт логов
- Мониторинг ошибок

### 🚀 Развертывание
- Автоматическое развертывание
- Управление средами
- Мониторинг статуса
- Откат изменений

### 🔗 Интеграции
- REST API
- GraphQL
- Базы данных
- Веб-скрапинг
- CSV/XML парсеры
- Файловое хранилище

### 📱 Платформы
- Telegram Bot API
- MAX Messenger
- WhatsApp Business
- Discord

## 🛠️ Установка

### Требования
- Node.js 16+
- npm 8+
- Windows/Linux/macOS

### Быстрый старт

```bash
# Клонирование репозитория
git clone https://github.com/kas-admin07/kiro-bot-constructor.git
cd kiro-bot-constructor

# Установка зависимостей
npm install

# Создание файла конфигурации
cp .env.example .env

# Запуск сервера
npm start
```

### Конфигурация

Создайте файл `.env` на основе `.env.example`:

```env
# Основные настройки
PORT=3000
NODE_ENV=development

# Безопасность
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret

# База данных (опционально)
DATABASE_URL=sqlite:./data/database.sqlite

# Telegram API (для тестирования)
TELEGRAM_BOT_TOKEN=your-bot-token

# Логирование
LOG_LEVEL=info
LOG_FILE=./data/logs/app.log
```

## 📖 Использование

### 1. Создание бота

1. Откройте дашборд: `http://localhost:3000/dashboard`
2. Нажмите "Создать бота"
3. Заполните основную информацию
4. Добавьте токен от @BotFather
5. Настройте команды и ответы

### 2. Визуальное редактирование

1. Перейдите в визуальный редактор
2. Перетащите элементы на холст
3. Настройте связи между узлами
4. Сохраните схему

### 3. Развертывание

1. Откройте раздел "Развертывание"
2. Выберите бота для развертывания
3. Настройте параметры среды
4. Запустите развертывание

## 🏗️ Архитектура

```
kiro-bot-constructor/
├── server.js              # Главный файл сервера
├── package.json           # Зависимости проекта
├── routes/                # API маршруты
│   ├── bots.js           # Управление ботами
│   ├── users.js          # Управление пользователями
│   ├── auth.js           # Аутентификация
│   ├── templates.js      # Шаблоны ботов
│   ├── visual-schemas.js # Визуальные схемы
│   ├── platforms.js      # Платформы
│   ├── integrations.js   # Интеграции
│   ├── deployment.js     # Развертывание
│   ├── runtime.js        # Среда выполнения
│   └── webhooks.js       # Webhook обработчики
├── utils/                 # Утилиты
│   ├── BotRuntime.js     # Среда выполнения ботов
│   ├── BotDeploymentManager.js # Менеджер развертывания
│   ├── IntegrationManager.js   # Менеджер интеграций
│   └── Logger.js         # Система логирования
├── public/               # Статические файлы
│   ├── dashboard.html    # Дашборд
│   ├── editor.html       # Редактор
│   ├── visual-editor.html # Визуальный редактор
│   └── assets/           # CSS, JS, изображения
├── frontend/             # Frontend компоненты
├── data/                 # Данные приложения
│   ├── bots/            # Конфигурации ботов
│   ├── users/           # Данные пользователей
│   ├── sessions/        # Сессии
│   ├── visual_schemas/  # Визуальные схемы
│   ├── templates/       # Шаблоны
│   ├── backups/         # Резервные копии
│   └── logs/            # Логи
└── docs/                # Документация
```

## 🔧 API Reference

### Боты
- `GET /api/bots` - Получить список ботов
- `POST /api/bots` - Создать нового бота
- `GET /api/bots/:id` - Получить бота по ID
- `PUT /api/bots/:id` - Обновить бота
- `DELETE /api/bots/:id` - Удалить бота

### Визуальные схемы
- `GET /api/visual-schemas` - Получить схемы
- `POST /api/visual-schemas` - Создать схему
- `PUT /api/visual-schemas/:id` - Обновить схему
- `DELETE /api/visual-schemas/:id` - Удалить схему

### Развертывание
- `POST /api/deployment/deploy/:botId` - Развернуть бота
- `POST /api/deployment/stop/:botId` - Остановить бота
- `GET /api/deployment/status/:botId` - Статус бота

### Интеграции
- `GET /api/integrations` - Список интеграций
- `POST /api/integrations` - Создать интеграцию
- `POST /api/integrations/:id/test` - Тестировать интеграцию

## 🧪 Тестирование

```bash
# Запуск всех тестов
npm test

# Запуск тестов в режиме наблюдения
npm run test:watch

# Линтинг кода
npm run lint

# Форматирование кода
npm run format
```

## 📝 Логирование

Система поддерживает несколько уровней логирования:
- `error` - Ошибки
- `warn` - Предупреждения
- `info` - Информационные сообщения
- `debug` - Отладочная информация

## 🔒 Безопасность

- JWT аутентификация
- Валидация входных данных
- Rate limiting
- CORS настройки
- Шифрование паролей
- Защита от XSS и CSRF

## 🤝 Участие в разработке

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Добавьте тесты
5. Отправьте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE)

## 🆘 Поддержка

- [Issues](https://github.com/kas-admin07/kiro-bot-constructor/issues)
- [Документация](https://github.com/kas-admin07/kiro-bot-constructor/wiki)
- [FAQ](https://github.com/kas-admin07/kiro-bot-constructor/wiki/FAQ)

---

**KIRO Bot Constructor** - создавайте ботов легко и быстро! 🚀