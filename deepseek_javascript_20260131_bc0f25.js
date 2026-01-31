// Конфигурация приложения
const CONFIG = {
    API_URL: 'https://ваш-backend.herokuapp.com', // Замените на ваш бэкенд
    SITE_NAME: 'Управление ботом'
};

// Состояние приложения
let AppState = {
    currentPage: 'dashboard',
    userData: null,
    isLoading: false
};

// Инициализация приложения
$(document).ready(function() {
    initApp();
    loadPage('dashboard');
    updateTime();
    
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
});

// Инициализация
function initApp() {
    console.log(`${CONFIG.SITE_NAME} инициализирован`);
    
    // Проверка авторизации
    checkAuth();
    
    // Обновление времени каждую минуту
    setInterval(updateTime, 60000);
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