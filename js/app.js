// ===================== КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ =====================
const CONFIG = {
    BACKEND_URL: 'https://bot-backend-production-14a7.up.railway.app', // <-- ТВОЙ URL БЭКЕНДА
    BOT_TOKEN: '8402586959:AAGRTEGtSy7KoUlJDZvaNSxL3JKuZPWUMrY',
    API_URL: 'https://api.telegram.org/bot',
    ADMIN_USER: 'admin',
    ADMIN_PASS: '123'
};

// Для совместимости со старым кодом
const BOT_CONFIG = {
    TOKEN: CONFIG.BOT_TOKEN,
    API_URL: CONFIG.API_URL
};

// ===================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ =====================
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

// ===================== ИНИЦИАЛИЗАЦИЯ =====================
$(document).ready(function() {
    console.log('Панель управления загружена');
    initApp();
    loadPage('dashboard');
    
    $(document).on('click', '.nav-link[data-page]', function(e) {
        e.preventDefault();
        loadPage($(this).data('page'));
    });
    
    $('#refresh-btn').click(function() {
        loadPage(AppState.currentPage, true);
    });
});

function initApp() {
    checkAuth();
    updateTime();
    setInterval(updateTime, 60000);
    checkBotStatus();
}

// ===================== РАБОТА С БЭКЕНДОМ =====================
async function fetchFromBackend(endpoint, options = {}) {
    const url = `${CONFIG.BACKEND_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': localStorage.getItem('admin_token') || ''
        }
    };
    
    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        return await response.json();
    } catch (error) {
        console.error(`Ошибка запроса к ${endpoint}:`, error);
        return { success: false, error: 'Сеть недоступна' };
    }
}

// ===================== АУТЕНТИФИКАЦИЯ =====================
function checkAuth() {
    const token = localStorage.getItem('admin_token');
    if (!token) showLoginModal();
}

function showLoginModal() {
    $('#modalContainer').html(`
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title"><i class="fas fa-lock me-2"></i>Вход в панель</h5>
                </div>
                <div class="modal-body">
                    <form id="loginForm">
                        <div class="mb-3">
                            <label class="form-label">Логин</label>
                            <input type="text" class="form-control" id="loginUsername" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Пароль</label>
                            <input type="password" class="form-control" id="loginPassword" required>
                        </div>
                    </form>
                    <div class="alert alert-info small">
                        <i class="fas fa-info-circle me-1"></i>
                        По умолчанию: admin / 123
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary w-100" onclick="performLogin()">
                        <i class="fas fa-sign-in-alt me-1"></i> Войти
                    </button>
                </div>
            </div>
        </div>
    `).modal({ backdrop: 'static', keyboard: false }).modal('show');
}

async function performLogin() {
    const username = $('#loginUsername').val();
    const password = $('#loginPassword').val();
    
    const result = await fetchFromBackend('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    });
    
    if (result.success) {
        localStorage.setItem('admin_token', result.token || 'demo_token');
        $('#modalContainer').modal('hide');
        showNotification('success', 'Успешный вход!', 'Добро пожаловать');
        loadDashboardStats();
    } else {
        showNotification('error', 'Ошибка входа', result.error || 'Неверные данные');
    }
}

// ===================== ОСНОВНЫЕ ФУНКЦИИ =====================
function loadPage(page, forceRefresh = false) {
    AppState.currentPage = page;
    
    $('.nav-link').removeClass('active');
    $(`.nav-link[data-page="${page}"]`).addClass('active');
    
    const titles = {
        dashboard: 'Дашборд',
        users: 'Пользователи',
        codes: 'Промокоды',
        transactions: 'Транзакции',
        settings: 'Настройки',
        api: 'API документация'
    };
    $('#page-title').text(titles[page] || 'Страница');
    
    // Показываем загрузку
    $('#page-content').html(`
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="mt-3">Загрузка ${titles[page]}...</p>
        </div>
    `);
    
    setTimeout(() => loadPageContent(page, forceRefresh), 300);
}

async function loadPageContent(page, forceRefresh) {
    switch(page) {
        case 'dashboard': await loadDashboardContent(); break;
        case 'users': await loadUsersContent(); break;
        case 'codes': await loadCodesContent(); break;
        case 'transactions': await loadTransactionsContent(); break;
        case 'settings': loadSettingsContent(); break;
        case 'api': loadApiContent(); break;
        default: await loadDashboardContent();
    }
}

// ===================== ДАШБОРД =====================
async function loadDashboardContent() {
    $('#page-content').html(`
        <div class="row g-4">
            <!-- Статистика будет здесь -->
        </div>
        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-bolt me-2"></i>Быстрые действия</h5>
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
                                <button class="btn btn-outline-info w-100" onclick="sendMessageToUser()">
                                    <i class="fas fa-paper-plane me-2"></i>Отправить сообщение
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
                    <div class="card-body" id="bot-info-content">
                        Загрузка...
                    </div>
                </div>
            </div>
            <div class="col-lg-6">
                <div class="card">
                    <div class="card-header bg-white">
                        <h5 class="mb-0"><i class="fas fa-history me-2"></i>Последние действия</h5>
                    </div>
                    <div class="card-body" id="recent-actions">
                        Нет данных
                    </div>
                </div>
            </div>
        </div>
    `);
    
    await loadDashboardStats();
    updateBotInfo();
}

async function loadDashboardStats() {
    try {
        const data = await fetchFromBackend('/api/dashboard');
        if (data.stats) {
            AppState.stats = data.stats;
            updateDashboardUI();
        }
    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
    }
}

function updateDashboardUI() {
    $('#total-users').text(AppState.stats.totalUsers || 0);
    $('#total-balance').text('$' + (AppState.stats.totalBalance || 0).toLocaleString('ru-RU'));
    $('#active-today').text(AppState.stats.activeToday || 0);
}

// ===================== ОТПРАВКА СООБЩЕНИЙ =====================
async function sendMessageToUser() {
    $('#modalContainer').html(`
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
                            <input type="number" class="form-control" id="messageUserId" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Текст сообщения</label>
                            <textarea class="form-control" id="messageText" rows="4" required></textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="sendMessageNow()">Отправить</button>
                </div>
            </div>
        </div>
    `).modal('show');
}

async function sendMessageNow() {
    const userId = $('#messageUserId').val();
    const text = $('#messageText').val();
    
    if (!userId || !text) {
        showNotification('error', 'Ошибка', 'Заполните все поля');
        return;
    }
    
    showNotification('info', 'Отправка', 'Отправка сообщения...');
    
    const result = await fetchFromBackend('/api/message/send', {
        method: 'POST',
        body: JSON.stringify({ chat_id: userId, text: text })
    });
    
    if (result.ok) {
        showNotification('success', 'Успех!', 'Сообщение отправлено');
        $('#modalContainer').modal('hide');
    } else {
        showNotification('error', 'Ошибка', result.description || 'Не удалось отправить');
    }
}

// ===================== ПОЛЬЗОВАТЕЛИ =====================
async function loadUsersContent() {
    $('#page-content').html(`
        <div class="card">
            <div class="card-header bg-white">
                <h5 class="mb-0"><i class="fas fa-users me-2"></i>Управление пользователями</h5>
            </div>
            <div class="card-body">
                <div class="mb-4">
                    <button class="btn btn-primary" onclick="showAddUserModal()">
                        <i class="fas fa-plus me-1"></i> Добавить пользователя
                    </button>
                </div>
                <div id="users-list">Загрузка...</div>
            </div>
        </div>
    `);
    
    await loadUserList();
}

async function loadUserList() {
    try {
        const data = await fetchFromBackend('/api/users');
        let html = '';
        
        if (data.users && data.users.length > 0) {
            html = `
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Telegram ID</th>
                                <th>Имя</th>
                                <th>Баланс</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            data.users.forEach(user => {
                html += `
                    <tr>
                        <td>${user.id}</td>
                        <td><code>${user.telegram_id || '-'}</code></td>
                        <td>${user.first_name || 'Без имени'}</td>
                        <td><span class="badge bg-success">$${user.balance || 0}</span></td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="editUser(${user.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            html += `</tbody></table></div>`;
        } else {
            html = '<p class="text-center py-4">Нет пользователей</p>';
        }
        
        $('#users-list').html(html);
    } catch (error) {
        $('#users-list').html('<div class="alert alert-danger">Ошибка загрузки</div>');
    }
}

function showAddUserModal() {
    $('#modalContainer').html(`
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Добавить пользователя</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="addUserForm">
                        <div class="mb-3">
                            <label class="form-label">Telegram ID</label>
                            <input type="number" class="form-control" id="telegramId" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Имя</label>
                            <input type="text" class="form-control" id="userName" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Начальный баланс ($)</label>
                            <input type="number" class="form-control" id="userBalance" value="0" step="0.01">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Отмена</button>
                    <button type="button" class="btn btn-primary" onclick="addNewUser()">Добавить</button>
                </div>
            </div>
        </div>
    `).modal('show');
}

async function addNewUser() {
    const userData = {
        telegram_id: $('#telegramId').val(),
        first_name: $('#userName').val(),
        balance: $('#userBalance').val() || 0
    };
    
    const result = await fetchFromBackend('/api/user/add', {
        method: 'POST',
        body: JSON.stringify(userData)
    });
    
    if (result.success) {
        showNotification('success', 'Успех!', 'Пользователь добавлен');
        $('#modalContainer').modal('hide');
        loadUserList();
    } else {
        showNotification('error', 'Ошибка', result.error || 'Не удалось добавить');
    }
}

// ===================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====================
async function checkBotStatus() {
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/getMe`);
        const data = await response.json();
        AppState.botInfo = data.ok ? data.result : null;
    } catch (error) {
        console.error('Ошибка проверки бота:', error);
    }
}

function updateBotInfo() {
    if (AppState.botInfo) {
        $('#bot-info-content').html(`
            <p><strong>Имя:</strong> ${AppState.botInfo.first_name}</p>
            <p><strong>Username:</strong> @${AppState.botInfo.username}</p>
            <p><strong>ID:</strong> ${AppState.botInfo.id}</p>
        `);
    }
}

function updateTime() {
    const now = new Date();
    $('#current-time').html(`
        <i class="far fa-clock"></i> ${now.toLocaleTimeString('ru-RU')}<br>
        <small class="text-muted">${now.toLocaleDateString('ru-RU')}</small>
    `);
}

function showNotification(type, title, message) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
    
    Toast.fire({ icon: type, title: title, text: message });
}

// ===================== ОСТАЛЬНЫЕ РАЗДЕЛЫ (ЗАГЛУШКИ) =====================
async function loadCodesContent() {
    $('#page-content').html('<div class="card"><div class="card-body"><h5>Промокоды</h5><p>Раздел в разработке</p></div></div>');
}

async function loadTransactionsContent() {
    $('#page-content').html('<div class="card"><div class="card-body"><h5>Транзакции</h5><p>Раздел в разработке</p></div></div>');
}

function loadSettingsContent() {
    $('#page-content').html(`
        <div class="card">
            <div class="card-body">
                <h5>Настройки</h5>
                <p>URL бэкенда: ${CONFIG.BACKEND_URL}</p>
                <button class="btn btn-primary" onclick="testBackendConnection()">
                    Проверить соединение с бэкендом
                </button>
            </div>
        </div>
    `);
}

function loadApiContent() {
    $('#page-content').html('<div class="card"><div class="card-body"><h5>API документация</h5><p>Раздел в разработке</p></div></div>');
}

async function testBackendConnection() {
    try {
        const response = await fetch(CONFIG.BACKEND_URL);
        showNotification('success', 'Успех!', 'Бэкенд доступен');
    } catch (error) {
        showNotification('error', 'Ошибка', 'Бэкенд недоступен');
    }
}

function showSettingsModal() {
    alert('Настройки - в разработке');
}

async function sendTestMessage() {
    showNotification('info', 'Проверка', 'Тестирование бота...');
    try {
        const response = await fetch(`${CONFIG.API_URL}${CONFIG.BOT_TOKEN}/getMe`);
        const data = await response.json();
        showNotification(data.ok ? 'success' : 'error', 
            data.ok ? 'Бот активен' : 'Ошибка', 
            data.ok ? `Бот @${data.result.username} работает` : data.description);
    } catch (error) {
        showNotification('error', 'Ошибка', 'Не удалось проверить бота');
    }
}

function editUser(id) {
    alert(`Редактирование пользователя ${id} - в разработке`);
}
