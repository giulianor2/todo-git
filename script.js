/**
 * To-Do App - Script Principal
 * Aplicação de gerenciamento de tarefas com armazenamento local
 */

// ============================================
// SELEÇÃO DE ELEMENTOS DO DOM
// ============================================

const todoInput = document.getElementById('todoInput');
const addBtn = document.getElementById('addBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const filterBtns = document.querySelectorAll('.filter-btn');
const clearBtn = document.getElementById('clearBtn');
const resetBtn = document.getElementById('resetBtn');
const totalCount = document.getElementById('totalCount');
const activeCount = document.getElementById('activeCount');
const completedCount = document.getElementById('completedCount');

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================

let todos = [];
let currentFilter = 'all';
const STORAGE_KEY = 'todos_app_data';

// ============================================
// INICIALIZAÇÃO
// ============================================

/**
 * Inicializa a aplicação ao carregar a página
 */
function init() {
    loadTodos();
    renderTodos();
    setupEventListeners();
    updateStats();
}

/**
 * Configura todos os event listeners
 */
function setupEventListeners() {
    // Input e botão de adicionar
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Filtros
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.filter;
            renderTodos();
        });
    });

    // Ações
    clearBtn.addEventListener('click', clearCompleted);
    resetBtn.addEventListener('click', resetAll);
}

// ============================================
// GERENCIAMENTO DE TAREFAS
// ============================================

/**
 * Adiciona uma nova tarefa à lista
 */
function addTodo() {
    const text = todoInput.value.trim();

    // Validação
    if (text === '') {
        showNotification('Por favor, digite uma tarefa!');
        return;
    }

    if (text.length > 200) {
        showNotification('A tarefa não pode ter mais de 200 caracteres!');
        return;
    }

    // Criar novo objeto de tarefa
    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toLocaleString('pt-BR')
    };

    // Adicionar à lista
    todos.unshift(newTodo);

    // Limpar input
    todoInput.value = '';
    todoInput.focus();

    // Atualizar UI
    saveTodos();
    renderTodos();
    updateStats();
    showNotification('Tarefa adicionada com sucesso! ✓');
}

/**
 * Alterna o status de conclusão de uma tarefa
 * @param {number} id - ID da tarefa
 */
function toggleTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
        updateStats();
    }
}

/**
 * Deleta uma tarefa da lista
 * @param {number} id - ID da tarefa
 */
function deleteTodo(id) {
    todos = todos.filter(t => t.id !== id);
    saveTodos();
    renderTodos();
    updateStats();
    showNotification('Tarefa removida! ✓');
}

/**
 * Limpa todas as tarefas concluídas
 */
function clearCompleted() {
    const completedCount = todos.filter(t => t.completed).length;

    if (completedCount === 0) {
        showNotification('Nenhuma tarefa concluída para limpar!');
        return;
    }

    if (confirm(`Tem certeza que deseja remover ${completedCount} tarefa(s) concluída(s)?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
        updateStats();
        showNotification('Tarefas concluídas removidas! ✓');
    }
}

/**
 * Reseta todas as tarefas
 */
function resetAll() {
    if (todos.length === 0) {
        showNotification('Não há tarefas para resetar!');
        return;
    }

    if (confirm('Tem certeza que deseja remover TODAS as tarefas? Esta ação não pode ser desfeita!')) {
        todos = [];
        currentFilter = 'all';
        filterBtns.forEach(btn => {
            if (btn.dataset.filter === 'all') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        saveTodos();
        renderTodos();
        updateStats();
        showNotification('Todas as tarefas foram removidas! ✓');
    }
}

// ============================================
// RENDERIZAÇÃO
// ============================================

/**
 * Renderiza a lista de tarefas de acordo com o filtro atual
 */
function renderTodos() {
    // Limpar lista
    todoList.innerHTML = '';

    // Filtrar tarefas
    const filteredTodos = getFilteredTodos();

    // Mostrar/ocultar estado vazio
    if (filteredTodos.length === 0) {
        emptyState.classList.add('show');
        todoList.style.display = 'none';
        return;
    }

    emptyState.classList.remove('show');
    todoList.style.display = 'block';

    // Renderizar cada tarefa
    filteredTodos.forEach(todo => {
        const li = createTodoElement(todo);
        todoList.appendChild(li);
    });
}

/**
 * Cria um elemento de tarefa
 * @param {Object} todo - Objeto da tarefa
 * @returns {HTMLElement} - Elemento da tarefa
 */
function createTodoElement(todo) {
    const li = document.createElement('li');
    li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
        <input 
            type="checkbox" 
            class="checkbox" 
            ${todo.completed ? 'checked' : ''}
            aria-label="Marcar tarefa como concluída"
        >
        <span class="todo-text" title="${todo.text}">${escapeHtml(todo.text)}</span>
        <div class="todo-actions">
            <button class="delete-btn" aria-label="Deletar tarefa">
                Deletar
            </button>
        </div>
    `;

    // Event listeners
    const checkbox = li.querySelector('.checkbox');
    const deleteBtn = li.querySelector('.delete-btn');

    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    return li;
}

/**
 * Obtém as tarefas filtradas de acordo com o filtro atual
 * @returns {Array} - Array de tarefas filtradas
 */
function getFilteredTodos() {
    switch (currentFilter) {
        case 'active':
            return todos.filter(t => !t.completed);
        case 'completed':
            return todos.filter(t => t.completed);
        default:
            return todos;
    }
}

// ============================================
// ATUALIZAÇÃO DE ESTATÍSTICAS
// ============================================

/**
 * Atualiza as estatísticas exibidas
 */
function updateStats() {
    const total = todos.length;
    const active = todos.filter(t => !t.completed).length;
    const completed = todos.filter(t => t.completed).length;

    totalCount.textContent = total;
    activeCount.textContent = active;
    completedCount.textContent = completed;

    // Animação de atualização
    animateStatUpdate(totalCount);
    animateStatUpdate(activeCount);
    animateStatUpdate(completedCount);
}

/**
 * Anima a atualização de uma estatística
 * @param {HTMLElement} element - Elemento da estatística
 */
function animateStatUpdate(element) {
    element.classList.add('loading');
    setTimeout(() => {
        element.classList.remove('loading');
    }, 300);
}

// ============================================
// ARMAZENAMENTO LOCAL
// ============================================

/**
 * Salva as tarefas no localStorage
 */
function saveTodos() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (error) {
        console.error('Erro ao salvar tarefas:', error);
        showNotification('Erro ao salvar tarefas!');
    }
}

/**
 * Carrega as tarefas do localStorage
 */
function loadTodos() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        todos = stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        todos = [];
    }
}

// ============================================
// UTILITÁRIOS
// ============================================

/**
 * Escapa caracteres especiais HTML para evitar XSS
 * @param {string} text - Texto a ser escapado
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Mostra uma notificação temporária
 * @param {string} message - Mensagem da notificação
 */
function showNotification(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ============================================
// INICIAR APLICAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', init);

// Exportar para testes (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        addTodo,
        toggleTodo,
        deleteTodo,
        clearCompleted,
        resetAll,
        getFilteredTodos
    };
}
