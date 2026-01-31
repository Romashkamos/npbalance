// Конфигурация бота
const BOT_CONFIG = {
    TOKEN: '8402586959:AAGRTEGtSy7KoUlJDZvaNSxL3JKuZPWUMrY',
    API_URL: 'https://api.telegram.org/bot'
};

// Состояние приложения
let AppState = {
    currentPage: 'dashboard',
    isLoading: false,
    botInfo: null,
    stats: {
        totalUsers: 0,
        activeToday: 0,
        totalBalance: 0,
        pendingWithdrawals: 0
    }
};

// Инициализация приложения
$(document).ready(function() {
    initApp();
    loadPage('dashboard');
    
    // Обработка навигации
    $(document).on('click', '.nav-link[data-page]', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        loadPage(page);
    });
    
    // Кнопка обновления
    $('#refresh-btn').click(function() {
        loadPage(AppState.currentPage);
    });
    
    // Автоматическая проверка бота
    checkBotStatus();
});

// Инициализация
function initApp() {
    console.log('Панель управления инициализирована');
    
    // Проверка авторизации
    checkAuth();
    
    // Обновление времени
    updateTime();
    setInterval(updateTime, 60000);
}

// Проверка статуса бота
async function checkBotStatus() {
    try {
        const response = await fetch(`${BOT_CONFIG.API_URL}${BOT_CONFIG.TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            AppState.botInfo = data.result;
            updateBotStatus(true, data.result.username);
        } else {
            updateBotStatus(false, 'Ошибка: ' + data.description);
        }
    } catch (error) {
        updateBotStatus(false, 'Сеть недоступна');
    }
}

function updateBotStatus(isActive, message) {
    const statusElement = $('#bot-status');
    if (statusElement.length) {
        const statusClass = isActive ? 'bg-success' : 'bg-danger';
        const statusText = isActive ? 'Бот онлайн' : 'Бот оффлайн';
        
        statusElement.html(`
            <small class="text-muted">Статус бота:</small>
            <div class="d-flex align-items-center mt-2">
                <div class="${statusClass} rounded-circle" style="width: 10px; height: 10px;"></div>
                <span class="ms-2 small">${statusText} (${message})</span>
            </div>
        `);
    }
}

// Обновление времени
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU');
    const dateStr = now.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    $('#current-time').html(`
        <i class="far fa-clock"></i> ${timeStr}<br>
        <small class="text-muted">${dateStr}</small>
    `);
}

// Загрузка страницы
function loadPage(page) {
    AppState.currentPage = page;
    
    // Обновляем активную ссылку
    $('.nav-link').removeClass('active');
    $(`.nav-link[data-page="${page}"]`).addClass('active');
    
    // Меняем заголовок
    const titles = {
        dashboard: 'Дашборд',
        users: 'Пользователи',
        codes: 'Промокоды',
        transactions: 'Транзакции',
        settings: 'Настройки',
        api: 'API документация'
    };
    $('#page-title').text(titles[page] || 'Страница');
    
    // Загружаем контент
    $.ajax({
        url: `pages/${page}.html`,
        method: 'GET',
        beforeSend: function() {
            $('#page-content').html(`
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-3">Загрузка ${titles[page]}...</p>
                </div>
            `);
        },
        success: function(html) {
            $('#page-content').html(html);
            initPageComponents(page);
        },
        error: function() {
            loadDefaultContent(page, titles[page]);
        }
    });
}

// Загрузка контента по умолчанию
function loadDefaultContent(page, title) {
    switch(page) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'users':
            loadUsersContent();
            break;
        default:
            $('#page-content').html(`
                <div class="card">
                    <div class="card-body text-center py-5">
                        <h4>${title}</h4>
                        <p>Раздел в разработке</p>
                        <button class="btn btn-primary" onclick="loadPage('dashboard')">
                            Вернуться на дашборд
                        </button>
                    </div>
                </div>
            `);
    }
}

// Загрузка контента дашборда
function loadDashboardContent() {
    const content = `
        <div class="row g-4">
            <div class="col-md-6 col-xl-3">
                <div class="card stat-card bg-primary text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-title mb-1">Пользователи</h6>
                                <h2 id="total-users" class="mb-0">0</h2>
                                <small class="opacity-75">Всего в базе</small>
                            </div>
                            <i class="fas fa-users fa-3x opacity-25"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 col-xl-3">
                <div class="card stat-card bg-success text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-title mb-1">Балансы</h6>
                                <h2 id="total-balance" class="mb-0">$0</h2>
                                <small class="opacity-75">Общая сумма</small>
                            </div>
                            <i class="fas fa-wallet fa-3x opacity-25"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 col-xl-3">
                <div class="card stat-card bg-info text-white">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-title mb-1">Активность</h6>
                                <h2 id="active-today" class="mb-0">0</h2>
                                <small class="opacity-75">За сегодня</small>
                            </div>
                            <i class="fas fa-chart-line fa-3x opacity-25"></i>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6 col-xl-3">
                <div class="card stat-card bg-warning text-dark">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <h6 class="card-title mb-1">Бот</h6>
                                <h2 class="mb-0" id="bot-username">...</h2>
                                <small class="opacity-75">Статус</small>
                            </div>
                            <i class="fas fa-robot fa-3x opacity-25"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-cog me-2"></i>Быстрые действия</h5>
                    </div>
                    <div class="card-body">
                        <div class="row g-3">
                            <div class="col-md-3">
                                <button class="btn btn-outline-primary w-100" onclick="sendTestMessage()">
                                    <i class="fas fa-paper-plane me-2"></i>Тест бота
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-outline-success w-100" onclick="showAddUserModal()">
                                    <i class="fas fa-user-plus me-2"></i>Добавить юзера
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-outline-info w-100" onclick="generatePromoCode()">
                                    <i class="fas fa-gift me-2"></i>Создать код
                                </button>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-outline-warning w-100" onclick="showSettingsModal()">
                                    <i class="fas fa-cog me-2"></i>Настройки
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i>Информация о боте</h5>
                    </div>
                    <div class="card-body">
                        <div id="bot-info">
                            <p class="text-center py-3">
                                <div class="spinner-border spinner-border-sm text-primary" role="status">
                                    <span class="visually-hidden">Загрузка...</span>
                                </div>
                                Загрузка информации о боте...
                            </p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-history me-2"></i>Последние действия</h5>
                    </div>
                    <div class="card-body">
                        <div id="recent-actions">
                            <p>Нет данных для отображения</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#page-content').html(content);
    
    // Обновляем информацию о боте
    updateBotInfo();
    loadDashboardStats();
}

// Обновление информации о боте
function updateBotInfo() {
    if (AppState.botInfo) {
        $('#bot-username').text('@' + AppState.botInfo.username);
        $('#bot-info').html(`
            <table class="table table-sm">
                <tr>
                    <td><strong>ID:</strong></td>
                    <td>${AppState.botInfo.id}</td>
                </tr>
                <tr>
                    <td><strong>Имя:</strong></td>
                    <td>${AppState.botInfo.first_name}</td>
                </tr>
                <tr>
                    <td><strong>Username:</strong></td>
                    <td>@${AppState.botInfo.username}</td>
                </tr>
                <tr>
                    <td><strong>Может читать сообщения:</strong></td>
                    <td>${AppState.botInfo.can_read_all_group_messages ? 'Да' : 'Нет'}</td>
                </tr>
            </table>
            <div class="text-center mt-3">
                <a href="https://t.me/${AppState.botInfo.username}" target="_blank" class="btn btn-sm btn-primary">
                    <i class="fas fa-external-link-alt me-1"></i> Открыть в Telegram
                </a>
            </div>
        `);
    }
}

// Загрузка статистики
async function loadDashboardStats() {
    // Заглушка - в реальном проекте здесь будет API запрос
    AppState.stats = {
        totalUsers: 1,
        activeToday: 1,
        totalBalance: 0,
        pendingWithdrawals: 0
    };
    
    $('#total-users').text(AppState.stats.totalUsers);
    $('#total-balance').text('$' + AppState.stats.totalBalance.toLocaleString('ru-RU'));
    $('#active-today').text(AppState.stats.activeToday);
}

// Загрузка контента пользователей
function loadUsersContent() {
    const content = `
        <div class="card">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="fas fa-users me-2"></i>Управление пользователями</h5>
            </div>
            <div class="card-body">
                <div class="mb-4">
                    <button class="btn btn-primary" onclick="showAddUserModal()">
                        <i class="fas fa-plus me-1"></i> Добавить пользователя
                    </button>
                    <button class="btn btn-outline-secondary ms-2" onclick="loadUserList()">
                        <i class="fas fa-sync-alt me-1"></i> Обновить список
                    </button>
                </div>
                
                <div id="users-list">
                    <div class="text-center py-4">
                        <p>Загрузка списка пользователей...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    $('#page-content').html(content);
    loadUserList();
}

// Загрузка списка пользователей
async function loadUserList() {
    // Заглушка - в реальном проекте здесь будет API запрос
    const users = [
        {
            id: 1,
            telegram_id: 'не указан',
            first_name: 'Тестовый пользователь',
            balance: 0,
            last_update: new Date().toLocaleDateString('ru-RU')
        }
    ];
    
    let html = '';
    if (users.length > 0) {
        html = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Telegram ID</th>
                            <th>Имя</th>
                            <th>Баланс</th>
                            <th>Обновлено</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        users.forEach(user => {
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td><code>${user.telegram_id}</code></td>
                    <td>${user.first_name}</td>
                    <td>
                        <span class="badge bg-success">$${user.balance.toFixed(2)}</span>
                    </td>
                    <td>${user.last_update}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
            <div class="text-muted small mt-2">
                Всего пользователей: ${users.length}
            </div>
        `;
    } else {
        html = `
            <div class="text-center py-5">
                <i class="fas fa-users fa-3x text-muted mb-3"></i>
                <h5>Нет пользователей</h5>
                <p class="text-muted">Добавьте первого пользователя</p>
            </div>
        `;
    }
    
    $('#users-list').html(html);
}

// Проверка авторизации
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) {
        showLoginModal();
    }
}

// Показать модальное окно логина
function showLoginModal() {
    const modalHtml = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-lock me-2"></i>Вход в панель управления</h5>
                </div>
                <div class="modal-body">
                    <form id="loginForm">
                        <div class="mb-3">
                            <label class="form-label">Логин администратора</label>
                            <input type="text" class="form-control" id="loginUsername" 
                                   placeholder="Введите логин" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Пароль</label>
                            <input type="password" class="form-control" id="loginPassword" 
                                   placeholder="Введите пароль" required>
                        </div>
                    </form>
                    <div class="alert alert-info small">
                        <i class="fas fa-info-circle me-1"></i>
                        По умолчанию: admin / admin123
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary w-100" onclick="performLogin()">
                        <i class="fas fa-sign-in-alt me-1"></i> Войти в систему
                    </button>
                </div>
            </div>
        </div>
    `;
    
    $('#modalContainer').html(modalHtml);
    $('#modalContainer').modal({backdrop: 'static', keyboard: false});
    $('#modalContainer').modal('show');
}

// Выполнить вход
function performLogin() {
    const username = $('#loginUsername').val();
    const password = $('#loginPassword').val();
    
    // Временная проверка - ЗАМЕНИ ЭТО НА БЕЗОПАСНУЮ ПРОВЕРКУ!
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('admin_token', 'demo_token_' + Date.now());
        
        $('#modalContainer').modal('hide');
        showNotification('success', 'Добро пожаловать!', 'Вы успешно вошли в систему');
        
        // Обновляем статистику
        loadDashboardStats();
    } else {
        showNotification('error', 'Ошибка входа', 'Неверный логин или пароль');
    }
}

// Показать уведомление
function showNotification(type, title, message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
    
    Toast.fire({
        icon: type,
        title: title,
        text: message
    });
}

// Отправить тестовое сообщение
async function sendTestMessage() {
    showNotification('info', 'Отправка', 'Проверка работы бота...');
    
    try {
        // Получаем информацию о боте
        const response = await fetch(`${BOT_CONFIG.API_URL}${BOT_CONFIG.TOKEN}/getMe`);
        const data = await response.json();
        
        if (data.ok) {
            showNotification('success', 'Бот активен', `Бот @${data.result.username} работает`);
        } else {
            showNotification('error', 'Ошибка бота', data.description);
        }
    } catch (error) {
        showNotification('error', 'Ошибка сети', 'Не удалось подключиться к Telegram API');
    }
}

// Модальное окно добавления пользователя
function showAddUserModal() {
    const modalHtml = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Добавить пользователя</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addUserForm">
                        <div class="mb-3">
                            <label class="form-label">Telegram ID пользователя</label>
                            <input type="number" class="form-control" id="telegramId" 
                                   placeholder="123456789" required>
                            <small class="text-muted">Узнать ID можно через @userinfobot</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Имя пользователя</label>
                            <input type="text" class="form-control" id="userName" 
                                   placeholder="Иван Иванов" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Начальный баланс ($)</label>
                            <input type="number" class="form-control" id="userBalance" 
                                   value="0" min="0" step="0.01">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="addNewUser()">Добавить</button>
                </div>
            </div>
        </div>
    `;
    
    $('#modalContainer').html(modalHtml);
    $('#modalContainer').modal('show');
}

// Добавить нового пользователя
function addNewUser() {
    showNotification('success', 'Пользователь добавлен', 'Данные сохранены в системе');
    $('#modalContainer').modal('hide');
    loadUserList();
}

// Создать промокод
function generatePromoCode() {
    const code = 'PROMO' + Math.random().toString(36).substr(2, 8).toUpperCase();
    showNotification('success', 'Промокод создан', `Код: ${code}, Сумма: $10`);
}

// Настройки
function showSettingsModal() {
    const modalHtml = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Настройки бота</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-1"></i>
                        <strong>Внимание!</strong> Токен бота виден в коде. Для безопасности перенесите его на бэкенд.
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Токен бота (текущий)</label>
                        <input type="text" class="form-control" value="${BOT_CONFIG.TOKEN}" readonly>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Минимальная сумма вывода ($)</label>
                        <input type="number" class="form-control" value="50" min="1">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Реферальный бонус ($)</label>
                        <input type="number" class="form-control" value="10" min="0">
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    <button type="button" class="btn btn-primary">Сохранить</button>
                </div>
            </div>
        </div>
    `;
    
    $('#modalContainer').html(modalHtml);
    $('#modalContainer').modal('show');
}

// Инициализация компонентов страницы
function initPageComponents(page) {
    // Инициализация компонентов для конкретной страницы
    console.log('Инициализация страницы:', page);
}

// Редактирование пользователя
function editUser(userId) {
    showNotification('info', 'Редактирование', 'Функция в разработке');
}        url: `pages/${page}.html`,
        method: 'GET',
        beforeSend: function() {
            $('#page-content').html(`
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Загрузка...</span>
                    </div>
                    <p class="mt-3">Загрузка ${titles[page]}...</p>
                </div>
            `);
        },
        success: function(html) {
            $('#page-content').html(html);
            
            // Инициализируем компоненты страницы
            initPageComponents(page);
            
            // Загружаем данные
            loadPageData(page);
        },
        error: function() {
            $('#page-content').html(`
                <div class="alert alert-danger">
                    <h4><i class="fas fa-exclamation-triangle"></i> Ошибка загрузки</h4>
                    <p>Не удалось загрузить страницу ${titles[page]}</p>
                    <button class="btn btn-primary" onclick="loadPage('${page}')">
                        Попробовать снова
                    </button>
                </div>
            `);
        }
    });
}

// Инициализация компонентов страницы
function initPageComponents(page) {
    switch(page) {
        case 'dashboard':
            initDashboard();
            break;
        case 'users':
            initUsersPage();
            break;
        case 'codes':
            initCodesPage();
            break;
        case 'transactions':
            initTransactionsPage();
            break;
        case 'settings':
            initSettingsPage();
            break;
        case 'api':
            initApiPage();
            break;
    }
}

// Загрузка данных страницы
function loadPageData(page) {
    // Здесь будут API запросы для загрузки данных
    console.log(`Загрузка данных для ${page}`);
}

// Обновление времени
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU');
    const dateStr = now.toLocaleDateString('ru-RU', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    $('#current-time').html(`
        <i class="far fa-clock"></i> ${timeStr}<br>
        <small class="text-muted">${dateStr}</small>
    `);
}

// Проверка авторизации
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token && window.location.hash !== '#login') {
        window.location.hash = 'login';
        showLoginModal();
    }
}

// Показать модальное окно логина
function showLoginModal() {
    const modalHtml = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-lock"></i> Вход в систему</h5>
                </div>
                <div class="modal-body">
                    <form id="loginForm">
                        <div class="mb-3">
                            <label class="form-label">Логин</label>
                            <input type="text" class="form-control" id="loginUsername" 
                                   placeholder="Введите логин" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Пароль</label>
                            <input type="password" class="form-control" id="loginPassword" 
                                   placeholder="Введите пароль" required>
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="rememberMe">
                            <label class="form-check-label" for="rememberMe">
                                Запомнить меня
                            </label>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary w-100" onclick="performLogin()">
                        <i class="fas fa-sign-in-alt"></i> Войти
                    </button>
                </div>
            </div>
        </div>
    `;
    
    $('#modalContainer').html(modalHtml);
    $('#modalContainer').modal('show');
}

// Выполнить вход
function performLogin() {
    const username = $('#loginUsername').val();
    const password = $('#loginPassword').val();
    
    // Простая проверка (в реальном приложении - запрос к API)
    if (username === 'admin' && password === 'admin123') {
        localStorage.setItem('admin_token', 'demo_token');
        localStorage.setItem('admin_username', username);
        
        $('#modalContainer').modal('hide');
        showNotification('success', 'Успешный вход!', 'Добро пожаловать в панель управления');
        loadPage('dashboard');
    } else {
        showNotification('error', 'Ошибка входа', 'Неверный логин или пароль');
    }
}

// Показать уведомление
function showNotification(type, title, message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
    
    Toast.fire({
        icon: type,
        title: title,
        text: message
    });
}

// Инициализация страницы Дашборд
function initDashboard() {
    // Загрузка статистики
    loadDashboardStats();
    
    // События для кнопок
    $('#generate-codes-btn').click(function() {
        showGenerateCodesModal();
    });
    
    // Обновление статистики каждые 30 секунд
    setInterval(loadDashboardStats, 30000);
}

// Загрузка статистики для дашборда
function loadDashboardStats() {
    // Заглушка - в реальном приложении здесь будет API запрос
    const stats = {
        totalUsers: 1250,
        activeToday: 342,
        totalBalance: 45280.50,
        pendingWithdrawals: 12400.00,
        activeCodes: 45,
        usedCodes: 289
    };
    
    $('#total-users').text(stats.totalUsers);
    $('#active-today').text(stats.activeToday);
    $('#total-balance').text('$' + stats.totalBalance.toLocaleString('ru-RU'));
    $('#pending-withdrawals').text('$' + stats.pendingWithdrawals.toLocaleString('ru-RU'));
    $('#active-codes').text(stats.activeCodes);
    $('#used-codes').text(stats.usedCodes);
}

// Инициализация страницы Пользователи
function initUsersPage() {
    // Инициализация DataTable
    $('#usersTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/ru.json'
        },
        pageLength: 25,
        ajax: {
            url: `${CONFIG.API_URL}/api/users`,
            dataSrc: ''
        },
        columns: [
            { data: 'id', title: 'ID' },
            { 
                data: 'username', 
                title: 'Пользователь',
                render: function(data, type, row) {
                    return `
                        <div>
                            <strong>${row.first_name || 'Без имени'}</strong>
                            ${row.username ? `<br><small class="text-muted">@${row.username}</small>` : ''}
                        </div>
                    `;
                }
            },
            { 
                data: 'balance', 
                title: 'Баланс',
                render: function(data) {
                    return `<span class="badge bg-success">$${parseFloat(data).toFixed(2)}</span>`;
                }
            },
            { 
                data: 'refs', 
                title: 'Рефералы',
                render: function(data) {
                    return `<span class="badge bg-info">${data}</span>`;
                }
            },
            { 
                data: 'last_update', 
                title: 'Обновлено' 
            },
            {
                data: 'id',
                title: 'Действия',
                orderable: false,
                render: function(data, type, row) {
                    return `
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-info" onclick="viewUser(${data})" title="Просмотр">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="btn btn-success" onclick="addBalance(${data})" title="Пополнить">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button class="btn btn-warning" onclick="editUser(${data})" title="Редактировать">
                                <i class="fas fa-edit"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ]
    });
    
    // Кнопка поиска
    $('#search-users').on('keyup', function() {
        $('#usersTable').DataTable().search($(this).val()).draw();
    });
}

// Инициализация страницы Промокоды
function initCodesPage() {
    // Таблица кодов
    $('#codesTable').DataTable({
        language: {
            url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/ru.json'
        },
        pageLength: 25,
        columns: [
            { data: 'code', title: 'Код' },
            { 
                data: 'amount', 
                title: 'Сумма',
                render: function(data) {
                    return `<span class="badge bg-primary">$${data}</span>`;
                }
            },
            { 
                data: 'is_used', 
                title: 'Статус',
                render: function(data) {
                    return data ? 
                        '<span class="badge bg-secondary">Использован</span>' :
                        '<span class="badge bg-success">Активен</span>';
                }
            },
            { data: 'created_at', title: 'Создан' },
            { data: 'used_by', title: 'Использовал' },
            {
                data: 'code',
                title: 'Действия',
                orderable: false,
                render: function(data, type, row) {
                    return row.is_used ? '' : `
                        <button class="btn btn-danger btn-sm" onclick="deleteCode('${data}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                }
            }
        ]
    });
    
    // Генерация кодов
    $('#generate-codes-form').submit(function(e) {
        e.preventDefault();
        
        const amount = $('#code-amount').val();
        const count = $('#code-count').val();
        const prefix = $('#code-prefix').val() || 'CODE';
        
        // Здесь будет API запрос
        showNotification('info', 'Генерация кодов', `Создано ${count} кодов по $${amount}`);
        
        // Очистка формы
        $(this).trigger('reset');
    });
}

// Инициализация страницы Настройки
function initSettingsPage() {
    // Загрузка настроек
    loadSettings();
    
    // Сохранение настроек
    $('#save-settings').click(function() {
        saveSettings();
    });
}

// Загрузка настроек
function loadSettings() {
    const defaultSettings = {
        min_withdrawal: '50',
        referral_bonus: '10',
        daily_bonus: '5',
        bot_token: '',
        admin_id: ''
    };
    
    Object.keys(defaultSettings).forEach(key => {
        $(`#${key}`).val(localStorage.getItem(key) || defaultSettings[key]);
    });
}

// Сохранение настроек
function saveSettings() {
    const settings = {
        min_withdrawal: $('#min_withdrawal').val(),
        referral_bonus: $('#referral_bonus').val(),
        daily_bonus: $('#daily_bonus').val(),
        bot_token: $('#bot_token').val(),
        admin_id: $('#admin_id').val()
    };
    
    Object.keys(settings).forEach(key => {
        localStorage.setItem(key, settings[key]);
    });
    
    showNotification('success', 'Настройки сохранены', 'Изменения применены успешно');
}

// Инициализация страницы API
function initApiPage() {
    // Таблица с API методами
    const apiMethods = [
        {
            method: 'GET',
            endpoint: '/api/users',
            description: 'Получить список пользователей',
            auth: 'Требуется'
        },
        {
            method: 'POST',
            endpoint: '/api/user/balance',
            description: 'Изменить баланс пользователя',
            auth: 'Требуется'
        },
        {
            method: 'POST',
            endpoint: '/api/codes/generate',
            description: 'Сгенерировать промокоды',
            auth: 'Требуется'
        },
        {
            method: 'POST',
            endpoint: '/api/bot/user',
            description: 'Получить данные пользователя (для бота)',
            auth: 'Не требуется'
        },
        {
            method: 'POST',
            endpoint: '/api/bot/code',
            description: 'Активировать промокод (для бота)',
            auth: 'Не требуется'
        }
    ];
    
    let tableHtml = `
        <table class="table">
            <thead>
                <tr>
                    <th>Метод</th>
                    <th>Эндпоинт</th>
                    <th>Описание</th>
                    <th>Авторизация</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    apiMethods.forEach(item => {
        tableHtml += `
            <tr>
                <td><span class="badge bg-${item.method === 'GET' ? 'info' : 'success'}">${item.method}</span></td>
                <td><code>${CONFIG.API_URL}${item.endpoint}</code></td>
                <td>${item.description}</td>
                <td>${item.auth}</td>
            </tr>
        `;
    });
    
    tableHtml += '</tbody></table>';
    
    $('#api-methods').html(tableHtml);
}

// Вспомогательные функции
function showGenerateCodesModal() {
    const modalHtml = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-gift"></i> Создать промокоды</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="generateCodesForm">
                        <div class="mb-3">
                            <label class="form-label">Сумма ($)</label>
                            <input type="number" class="form-control" min="1" max="1000" step="0.01" 
                                   value="100" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Количество</label>
                            <input type="number" class="form-control" min="1" max="100" 
                                   value="10" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Префикс (необязательно)</label>
                            <input type="text" class="form-control" maxlength="10" 
                                   placeholder="Например: BONUS">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="generateCodes()">Создать</button>
                </div>
            </div>
        </div>
    `;
    
    $('#modalContainer').html(modalHtml);
    $('#modalContainer').modal('show');
}

function generateCodes() {
    // Здесь будет API запрос
    $('#modalContainer').modal('hide');
    showNotification('success', 'Коды созданы', 'Промокоды успешно сгенерированы');
}

function viewUser(userId) {
    alert(`Просмотр пользователя ${userId}`);
}

function addBalance(userId) {
    alert(`Пополнение баланса пользователя ${userId}`);
}

function editUser(userId) {
    alert(`Редактирование пользователя ${userId}`);
}

function deleteCode(code) {
    if (confirm(`Удалить код ${code}?`)) {
        showNotification('success', 'Код удален', `Код ${code} был удален`);
    }
}

// Добавь эти функции в конец файла js/app.js

// Отправка сообщения пользователю
async function sendMessageToUser() {
    const modalHtml = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-paper-plane me-2"></i>Отправить сообщение</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="sendMessageForm">
                        <div class="mb-3">
                            <label class="form-label">ID пользователя Telegram</label>
                            <input type="number" class="form-control" id="messageUserId" 
                                   placeholder="123456789" required>
                            <small class="text-muted">ID получателя</small>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Текст сообщения</label>
                            <textarea class="form-control" id="messageText" rows="4" 
                                      placeholder="Введите текст сообщения..." required></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Тип сообщения</label>
                            <select class="form-select" id="messageType">
                                <option value="text">Текст</option>
                                <option value="html">HTML форматирование</option>
                                <option value="notification">Уведомление</option>
                            </select>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="sendMessageNow()">Отправить</button>
                </div>
            </div>
        </div>
    `;
    
    $('#modalContainer').html(modalHtml);
    $('#modalContainer').modal('show');
}

// Отправка сообщения через API
async function sendMessageNow() {
    const userId = $('#messageUserId').val();
    const text = $('#messageText').val();
    const type = $('#messageType').val();
    
    if (!userId || !text) {
        showNotification('error', 'Ошибка', 'Заполните все поля');
        return;
    }
    
    // Показываем загрузку
    showNotification('info', 'Отправка', 'Отправка сообщения...');
    
    try {
        // Временно используем прямое обращение к Telegram API (в будущем - через бэкенд)
        const response = await fetch(`https://api.telegram.org/bot${APP_CONFIG.BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: userId,
                text: text,
                parse_mode: type === 'html' ? 'HTML' : 'Markdown'
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            showNotification('success', 'Успех!', 'Сообщение отправлено');
            $('#modalContainer').modal('hide');
            
            // Сохраняем в историю
            saveToMessageHistory(userId, text, 'outgoing');
        } else {
            showNotification('error', 'Ошибка отправки', data.description || 'Неизвестная ошибка');
        }
    } catch (error) {
        showNotification('error', 'Ошибка сети', 'Не удалось отправить сообщение');
    }
}

// Сохраняем сообщение в историю
function saveToMessageHistory(userId, text, direction) {
    const history = JSON.parse(localStorage.getItem('message_history') || '[]');
    history.push({
        id: Date.now(),
        userId: userId,
        text: text,
        direction: direction,
        timestamp: new Date().toISOString(),
        status: 'sent'
    });
    
    // Храним только последние 100 сообщений
    if (history.length > 100) {
        history.shift();
    }
    
    localStorage.setItem('message_history', JSON.stringify(history));
}

// Показать историю сообщений
function showMessageHistory() {
    const modalHtml = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-history me-2"></i>История сообщений</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div id="messageHistoryList">
                        <div class="text-center py-4">
                            <p>Загрузка истории сообщений...</p>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
                    <button type="button" class="btn btn-primary" onclick="sendMessageToUser()">
                        <i class="fas fa-paper-plane me-1"></i> Новое сообщение
                    </button>
                </div>
            </div>
        </div>
    `;
    
    $('#modalContainer').html(modalHtml);
    $('#modalContainer').modal('show');
    
    // Загружаем историю
    setTimeout(loadMessageHistory, 100);
}

// Загрузить историю сообщений
function loadMessageHistory() {
    const history = JSON.parse(localStorage.getItem('message_history') || '[]');
    let html = '';
    
    if (history.length === 0) {
        html = `
            <div class="text-center py-5">
                <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                <h5>Нет сообщений</h5>
                <p class="text-muted">Здесь будет отображаться история переписки</p>
                <button class="btn btn-primary" onclick="sendMessageToUser()">
                    <i class="fas fa-paper-plane me-1"></i> Отправить первое сообщение
                </button>
            </div>
        `;
    } else {
        history.reverse().forEach(msg => {
            const date = new Date(msg.timestamp);
            const timeStr = date.toLocaleTimeString('ru-RU');
            const dateStr = date.toLocaleDateString('ru-RU');
            
            html += `
                <div class="card mb-3 ${msg.direction === 'outgoing' ? 'border-primary' : 'border-secondary'}">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <strong>ID ${msg.userId}</strong>
                                <span class="badge ${msg.direction === 'outgoing' ? 'bg-primary' : 'bg-secondary'} ms-2">
                                    ${msg.direction === 'outgoing' ? 'Исходящее' : 'Входящее'}
                                </span>
                            </div>
                            <small class="text-muted">${dateStr} ${timeStr}</small>
                        </div>
                        <p class="mb-0">${msg.text}</p>
                    </div>
                </div>
            `;
        });
    }
    
    $('#messageHistoryList').html(html);
}

// Добавь кнопку отправки сообщений на дашборд (в getDashboardContent функцию):
// В раздел "Быстрые действия" добавь:
`<button class="btn btn-outline-info" onclick="sendMessageToUser()">
    <i class="fas fa-paper-plane me-2"></i> Отправить сообщение
</button>`
