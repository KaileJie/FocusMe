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

// 请求通知权限
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            console.log('Notification permission:', permission);
        });
    }
}

// 发送桌面通知
function sendNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'focus-me-timer',
            requireInteraction: false,
            ...options
        });
        
        // 自动关闭通知
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        // 点击通知时聚焦窗口
        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    }
}

// 初始化
function init() {
    loadData();
    updateDisplay();
    renderTodos();
    renderHistory();
    updateStats();
    requestNotificationPermission();
    
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
    
    // 时间筛选按钮事件
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            renderHistory();
        });
    });
    
    // 窗口大小调整时重新绘制图表
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderHistory();
        }, 250);
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
    if (savedHistory) {
        try {
            state.history = JSON.parse(savedHistory);
        } catch (e) {
            console.error('Error parsing history:', e);
            state.history = [];
        }
    }
    
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
        
            // 发送桌面通知
        sendNotification('🍅 Focus Time Complete!', {
            body: `Great job! You've completed ${state.todayStats.pomodoros} pomodoro${state.todayStats.pomodoros > 1 ? 's' : ''} today. Time for a break!`,
            badge: '/icon-192.png',
            vibrate: [200, 100, 200]
        });
        
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
        
        // 发送桌面通知
        sendNotification('✨ Break Complete!', {
            body: 'Ready to focus again? Start a new pomodoro session!',
            badge: '/icon-192.png'
        });
        
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

// 获取按时间周期筛选的数据
function getFilteredHistory() {
    if (state.history.length === 0) return [];
    
    const now = new Date();
    let startDate;
    
    switch (currentPeriod) {
        case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    return state.history.filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= startDate;
    });
}

// 按日期分组数据
function groupHistoryByDate(history) {
    const grouped = {};
    
    history.forEach(record => {
        const date = new Date(record.date);
        let key;
        
        if (currentPeriod === 'week') {
            key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (currentPeriod === 'month') {
            key = `Week ${Math.ceil(date.getDate() / 7)}`;
        } else {
            key = date.toLocaleDateString('en-US', { month: 'short' });
        }
        
        if (!grouped[key]) {
            grouped[key] = { pomodoros: 0, minutes: 0, tasks: 0 };
        }
        
        grouped[key].pomodoros += record.pomodoros || 0;
        grouped[key].minutes += record.minutes || 0;
        grouped[key].tasks += record.completedTodos || 0;
    });
    
    return grouped;
}

// 绘制柱状图
function drawChart(data) {
    if (!historyChart) return;
    
    const ctx = historyChart.getContext('2d');
    const width = historyChart.width = historyChart.offsetWidth;
    const height = historyChart.height = 200;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    if (Object.keys(data).length === 0) {
        ctx.fillStyle = '#64748B';
        ctx.font = '14px -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', width / 2, height / 2);
        return;
    }
    
    const labels = Object.keys(data);
    const values = labels.map(key => data[key].pomodoros);
    const maxValue = Math.max(...values, 1);
    
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const barWidth = chartWidth / labels.length * 0.7;
    const barSpacing = chartWidth / labels.length;
    
    // 绘制柱状图
    labels.forEach((label, index) => {
        const value = values[index];
        const barHeight = (value / maxValue) * chartHeight;
        const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
        const y = height - padding - barHeight;
        
        // 柱状图
        const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
        gradient.addColorStop(0, '#EF4444');
        gradient.addColorStop(1, '#DC2626');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 数值标签
        if (value > 0) {
            ctx.fillStyle = '#0F172A';
            ctx.font = '12px -apple-system';
            ctx.textAlign = 'center';
            ctx.fillText(value, x + barWidth / 2, y - 5);
        }
        
        // X轴标签
        ctx.fillStyle = '#64748B';
        ctx.font = '11px -apple-system';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth / 2, height - padding + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.fillText(label, 0, 0);
        ctx.restore();
    });
    
    // Y轴刻度
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
}

function renderHistory() {
    const filteredHistory = getFilteredHistory();
    
    // 绘制图表
    if (filteredHistory.length > 0) {
        const groupedData = groupHistoryByDate(filteredHistory);
        drawChart(groupedData);
    } else {
        drawChart({});
    }
    
    // 显示列表
    historyList.innerHTML = '';
    
    if (filteredHistory.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 20px;">No history for this period</div>';
        return;
    }
    
    // 按日期分组显示
    const grouped = groupHistoryByDate(filteredHistory);
    const sortedLabels = Object.keys(grouped).sort((a, b) => {
        // 简单排序，实际应该按日期
        return a.localeCompare(b);
    });
    
    sortedLabels.forEach(label => {
        const data = grouped[label];
        const div = document.createElement('div');
        div.className = 'history-item';
        
        div.innerHTML = `
            <span class="history-date">${label}</span>
            <span class="history-stats">
                ${data.pomodoros} pomodoros | ${data.tasks} tasks | ${data.minutes} min
            </span>
        `;
        
        historyList.appendChild(div);
    });
}

// 将函数暴露到全局，以便在HTML中使用
window.toggleTodo = toggleTodo;
window.deleteTodo = deleteTodo;

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful');
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed');
      });
  });
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', init);

