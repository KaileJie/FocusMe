// 状态管理
let state = {
    isRunning: false,
    isPaused: false,
    isBreak: false,
    totalSeconds: 25 * 60, // 默认25分钟
    currentSeconds: 25 * 60,
    intervalId: null,
    todos: [],
    todayStats: {
        pomodoros: 0,
        completedTodos: 0,
        minutes: 0
    },
    history: []
};

// DOM 元素
const workMinutesInput = document.getElementById('workMinutes');
const breakMinutesInput = document.getElementById('breakMinutes');
const displayTime = document.getElementById('displayTime');
const timerStatus = document.getElementById('timerStatus');
const progressCircle = document.getElementById('progressCircle');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const todayPomodoros = document.getElementById('todayPomodoros');
const todayTodos = document.getElementById('todayTodos');
const todayMinutes = document.getElementById('todayMinutes');
const historyList = document.getElementById('historyList');

// 初始化
function init() {
    loadData();
    updateDisplay();
    renderTodos();
    renderHistory();
    updateStats();
    
    // 事件监听
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    workMinutesInput.addEventListener('change', updateTimerDuration);
    breakMinutesInput.addEventListener('change', () => {});
    addTodoBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
}

// 数据持久化
function saveData() {
    localStorage.setItem('focusMeTodos', JSON.stringify(state.todos));
    localStorage.setItem('focusMeStats', JSON.stringify(state.todayStats));
    localStorage.setItem('focusMeHistory', JSON.stringify(state.history));
}

function loadData() {
    const savedTodos = localStorage.getItem('focusMeTodos');
    const savedStats = localStorage.getItem('focusMeStats');
    const savedHistory = localStorage.getItem('focusMeHistory');
    
    if (savedTodos) state.todos = JSON.parse(savedTodos);
    if (savedStats) state.todayStats = JSON.parse(savedStats);
    if (savedHistory) state.history = JSON.parse(savedHistory);
    
    // 检查是否是新的日期，如果是则重置今日统计
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('focusMeLastDate');
    if (lastDate !== today) {
        // 保存昨天的数据到历史记录
        if (lastDate && state.todayStats.pomodoros > 0) {
            state.history.push({
                date: lastDate,
                ...state.todayStats
            });
        }
        // 重置今日统计
        state.todayStats = {
            pomodoros: 0,
            completedTodos: 0,
            minutes: 0
        };
        localStorage.setItem('focusMeLastDate', today);
        saveData();
    }
}

// 计时器功能
function updateTimerDuration() {
    if (!state.isRunning && !state.isPaused) {
        const minutes = parseInt(workMinutesInput.value) || 25;
        state.totalSeconds = minutes * 60;
        state.currentSeconds = minutes * 60;
        updateDisplay();
    }
}

function startTimer() {
    if (state.isPaused) {
        // 继续计时
        state.isPaused = false;
        state.isRunning = true;
    } else {
        // 开始新的计时
        if (!state.isBreak) {
            const minutes = parseInt(workMinutesInput.value) || 25;
            state.totalSeconds = minutes * 60;
            state.currentSeconds = minutes * 60;
        } else {
            const minutes = parseInt(breakMinutesInput.value) || 5;
            state.totalSeconds = minutes * 60;
            state.currentSeconds = minutes * 60;
        }
        state.isRunning = true;
    }
    
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    workMinutesInput.disabled = true;
    breakMinutesInput.disabled = true;
    
    timerStatus.textContent = state.isBreak ? 'On break...' : 'Focusing...';
    
    state.intervalId = setInterval(() => {
        state.currentSeconds--;
        updateDisplay();
        
        if (state.currentSeconds <= 0) {
            completeTimer();
        }
    }, 1000);
}

function pauseTimer() {
    state.isRunning = false;
    state.isPaused = true;
    clearInterval(state.intervalId);
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    timerStatus.textContent = 'Paused';
}

function resetTimer() {
    state.isRunning = false;
    state.isPaused = false;
    clearInterval(state.intervalId);
    
    const minutes = parseInt(workMinutesInput.value) || 25;
    state.totalSeconds = minutes * 60;
    state.currentSeconds = minutes * 60;
    state.isBreak = false;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    workMinutesInput.disabled = false;
    breakMinutesInput.disabled = false;
    
    timerStatus.textContent = 'Ready to start';
    updateDisplay();
}

function completeTimer() {
    clearInterval(state.intervalId);
    state.isRunning = false;
    state.isPaused = false;
    
    // 播放提示音（浏览器可能会阻止，需要用户交互）
    playNotification();
    
    if (!state.isBreak) {
        // 完成一个番茄钟
        state.todayStats.pomodoros++;
        state.todayStats.minutes += parseInt(workMinutesInput.value) || 25;
        state.isBreak = true;
        
        // 切换到休息时间
        const breakMinutes = parseInt(breakMinutesInput.value) || 5;
        state.totalSeconds = breakMinutes * 60;
        state.currentSeconds = breakMinutes * 60;
        
        timerStatus.textContent = 'Break time!';
        updateStats();
        saveData();
        
        // Ask if user wants to start break
        setTimeout(() => {
            if (confirm('Focus time complete! Start break?')) {
                startTimer();
            } else {
                resetTimer();
            }
        }, 100);
    } else {
        // Break ended
        timerStatus.textContent = 'Break complete!';
        resetTimer();
    }
}

function playNotification() {
    // 创建音频上下文播放提示音
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('无法播放提示音');
    }
}

function updateDisplay() {
    const minutes = Math.floor(state.currentSeconds / 60);
    const seconds = state.currentSeconds % 60;
    displayTime.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    // 更新进度条
    const progress = 1 - (state.currentSeconds / state.totalSeconds);
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * (1 - progress);
    progressCircle.style.strokeDashoffset = offset;
}

// 待办事项功能
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;
    
    const todo = {
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    state.todos.push(todo);
    todoInput.value = '';
    renderTodos();
    saveData();
}

function toggleTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        if (todo.completed) {
            state.todayStats.completedTodos++;
        } else {
            state.todayStats.completedTodos = Math.max(0, state.todayStats.completedTodos - 1);
        }
        renderTodos();
        updateStats();
        saveData();
    }
}

function deleteTodo(id) {
    const todo = state.todos.find(t => t.id === id);
    if (todo && todo.completed) {
        state.todayStats.completedTodos = Math.max(0, state.todayStats.completedTodos - 1);
    }
    state.todos = state.todos.filter(t => t.id !== id);
    renderTodos();
    updateStats();
    saveData();
}

function renderTodos() {
    todoList.innerHTML = '';
    
    if (state.todos.length === 0) {
        todoList.innerHTML = '<li style="text-align: center; color: var(--text-light); padding: 20px;">No tasks yet. Add one to get started.</li>';
        return;
    }
    
    state.todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''} 
                   onchange="toggleTodo(${todo.id})">
            <span class="todo-text">${escapeHtml(todo.text)}</span>
            <button class="todo-delete" onclick="deleteTodo(${todo.id})">×</button>
        `;
        
        todoList.appendChild(li);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 统计功能
function updateStats() {
    todayPomodoros.textContent = state.todayStats.pomodoros;
    todayTodos.textContent = state.todayStats.completedTodos;
    todayMinutes.textContent = state.todayStats.minutes;
}

function renderHistory() {
    historyList.innerHTML = '';
    
    if (state.history.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 20px;">No history yet</div>';
        return;
    }
    
    // 显示最近7天的记录
    const recentHistory = state.history.slice(-7).reverse();
    
    recentHistory.forEach(record => {
        const div = document.createElement('div');
        div.className = 'history-item';
        
        const date = new Date(record.date);
        const dateStr = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        div.innerHTML = `
            <span class="history-date">${dateStr}</span>
            <span class="history-stats">
                ${record.pomodoros} pomodoros | ${record.completedTodos} tasks | ${record.minutes} min
            </span>
        `;
        
        historyList.appendChild(div);
    });
}

// 将函数暴露到全局，以便在HTML中使用
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);

