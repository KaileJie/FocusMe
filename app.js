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
let historyChart = null;
let currentPeriod = 'week'; // week, month, year
let barRegions = []; // 存储每个柱子的区域信息，用于鼠标悬停检测
let chartTooltip = null; // tooltip 元素

// 延迟获取chart元素，确保DOM已加载
function getHistoryChart() {
    if (!historyChart) {
        historyChart = document.getElementById('historyChart');
    }
    return historyChart;
}

// 格式化时间为 Hour/minute 格式
function formatTime(minutes) {
    if (minutes === 0) return '0 min';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) {
        return `${mins} min`;
    } else if (mins === 0) {
        return `${hours} h`;
    } else {
        return `${hours} h ${mins} min`;
    }
}

// 创建 tooltip 元素
function createTooltip() {
    if (!chartTooltip) {
        chartTooltip = document.createElement('div');
        chartTooltip.id = 'chartTooltip';
        chartTooltip.style.cssText = `
            position: fixed;
            background: rgba(31, 41, 55, 0.95);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            white-space: nowrap;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
        `;
        document.body.appendChild(chartTooltip);
    }
    return chartTooltip;
}

// 显示 tooltip
function showTooltip(x, y, text) {
    const tooltip = createTooltip();
    tooltip.textContent = text;
    
    // 先设置一个临时位置使其可见，以便获取尺寸
    tooltip.style.left = '0px';
    tooltip.style.top = '0px';
    tooltip.style.opacity = '1';
    
    // 确保 tooltip 不会超出屏幕边界
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    let finalX = x;
    let finalY = y;
    
    // 如果 tooltip 会超出右边界，显示在鼠标左侧
    if (x + tooltipRect.width > viewportWidth) {
        finalX = x - tooltipRect.width - 10;
    }
    
    // 如果 tooltip 会超出上边界，显示在鼠标下方
    if (y - tooltipRect.height < 0) {
        finalY = y + 20;
    }
    
    tooltip.style.left = `${finalX}px`;
    tooltip.style.top = `${finalY}px`;
}

// 隐藏 tooltip
function hideTooltip() {
    if (chartTooltip) {
        chartTooltip.style.opacity = '0';
    }
}

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
    updateStats();
    requestNotificationPermission();
    
    // 延迟渲染图表，确保DOM完全加载
    setTimeout(() => {
        renderHistory();
    }, 50);
    
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
    
    // 历史记录详情折叠/展开按钮事件
    const toggleHistoryDetailsBtn = document.getElementById('toggleHistoryDetails');
    if (toggleHistoryDetailsBtn) {
        toggleHistoryDetailsBtn.addEventListener('click', () => {
            const historyList = document.getElementById('historyList');
            const isExpanded = toggleHistoryDetailsBtn.getAttribute('aria-expanded') === 'true';
            
            if (isExpanded) {
                // 隐藏
                historyList.classList.remove('show');
                setTimeout(() => {
                    historyList.style.display = 'none';
                }, 300);
                toggleHistoryDetailsBtn.setAttribute('aria-expanded', 'false');
                toggleHistoryDetailsBtn.querySelector('.toggle-label').textContent = 'View Details';
            } else {
                // 显示
                historyList.style.display = 'block';
                // 使用 requestAnimationFrame 确保样式更新后再添加动画类
                requestAnimationFrame(() => {
                    historyList.classList.add('show');
                });
                toggleHistoryDetailsBtn.setAttribute('aria-expanded', 'true');
                toggleHistoryDetailsBtn.querySelector('.toggle-label').textContent = 'Hide Details';
            }
        });
    }
    
    // 窗口大小调整时重新绘制图表
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            renderHistory();
        }, 250);
    });
    
    // 确保图表在页面完全加载后渲染
    setTimeout(() => {
        if (historyChart) {
            renderHistory();
        }
    }, 100);
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
            console.log('Loaded history from localStorage:', state.history.length, 'records');
        } catch (e) {
            console.error('Error parsing history:', e);
            state.history = [];
        }
    } else {
        console.log('No history found in localStorage');
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

// 获取按时间周期筛选的数据（包括今天的数据）
function getFilteredHistory() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate;
    
    switch (currentPeriod) {
        case 'week':
            // 过去7天（包括今天）
            startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
    }
    
    // 获取历史记录
    const historyRecords = state.history.filter(record => {
        try {
            const recordDate = new Date(record.date);
            // 如果日期无效，尝试其他格式
            if (isNaN(recordDate.getTime())) {
                // 尝试解析 DateString 格式
                const parsed = Date.parse(record.date);
                if (!isNaN(parsed)) {
                    recordDate.setTime(parsed);
                } else {
                    console.warn('Invalid date format:', record.date);
                    return false;
                }
            }
            recordDate.setHours(0, 0, 0, 0);
            return recordDate >= startDate && recordDate <= today;
        } catch (e) {
            console.error('Error filtering record:', record, e);
            return false;
        }
    });
    
    // 如果今天有数据，添加到记录中
    if (state.todayStats.pomodoros > 0 || state.todayStats.completedTodos > 0 || state.todayStats.minutes > 0) {
        const todayString = today.toDateString();
        // 检查今天是否已经在历史记录中
        const todayIndex = historyRecords.findIndex(r => {
            try {
                return new Date(r.date).toDateString() === todayString;
            } catch (e) {
                return false;
            }
        });
        
        const todayRecord = {
            date: todayString,
            pomodoros: state.todayStats.pomodoros,
            completedTodos: state.todayStats.completedTodos,
            minutes: state.todayStats.minutes
        };
        
        if (todayIndex >= 0) {
            // 合并今天的数据
            historyRecords[todayIndex] = {
                ...historyRecords[todayIndex],
                pomodoros: Math.max(historyRecords[todayIndex].pomodoros, todayRecord.pomodoros),
                completedTodos: Math.max(historyRecords[todayIndex].completedTodos, todayRecord.completedTodos),
                minutes: Math.max(historyRecords[todayIndex].minutes, todayRecord.minutes)
            };
        } else {
            historyRecords.push(todayRecord);
        }
    }
    
    // 按日期排序
    return historyRecords.sort((a, b) => {
        try {
            return new Date(a.date) - new Date(b.date);
        } catch (e) {
            return 0;
        }
    });
}

// 按日期分组数据
function groupHistoryByDate(history) {
    const grouped = {};
    const now = new Date();
    
    history.forEach(record => {
        try {
            let date = new Date(record.date);
            // 如果日期无效，尝试其他解析方式
            if (isNaN(date.getTime())) {
                // 尝试解析 DateString 格式
                const parsed = Date.parse(record.date);
                if (!isNaN(parsed)) {
                    date = new Date(parsed);
                } else {
                    console.warn('Invalid date format:', record.date);
                    return;
                }
            }
            
            // 再次检查日期是否有效
            if (isNaN(date.getTime())) {
                console.warn('Could not parse date:', record.date);
                return;
            }
            
            let key;
            let sortKey; // 用于排序
            
            if (currentPeriod === 'week') {
                // 显示为 "Mon 15" 格式（星期几 + 日期）
                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const dayName = dayNames[date.getDay()];
                const day = date.getDate();
                const month = date.getMonth() + 1;
                key = `${dayName} ${month}/${day}`;  // 格式：Mon 11/5
                sortKey = date.getTime();
            } else if (currentPeriod === 'month') {
                // 按月显示具体日期，而不是"Week X"
                const month = date.getMonth() + 1;
                const day = date.getDate();
                key = `${month}/${day}`;  // 格式：11/5
                sortKey = date.getTime();
            } else {
                // 年度视图：按月分组
                key = date.toLocaleDateString('en-US', { month: 'short' });
                sortKey = date.getMonth() * 100 + date.getDate();
            }
            
            if (!grouped[key]) {
                grouped[key] = { 
                    pomodoros: 0, 
                    minutes: 0, 
                    tasks: 0,
                    sortKey: sortKey,
                    date: date
                };
            }
            
            grouped[key].pomodoros += record.pomodoros || 0;
            grouped[key].minutes += record.minutes || 0;
            grouped[key].tasks += record.completedTodos || 0;
        } catch (e) {
            console.error('Error processing record:', record, e);
        }
    });
    
    return grouped;
}

// 绘制竖向柱状图
function drawChart(data) {
    const chart = getHistoryChart();
    if (!chart) {
        console.warn('Chart element not found');
        return;
    }
    
    const ctx = chart.getContext('2d');
    // 设置canvas尺寸，确保清晰度
    const rect = chart.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width || 800;
    const height = 300;
    
    chart.width = width * dpr;
    chart.height = height * dpr;
    ctx.scale(dpr, dpr);
    
    // 存储逻辑宽度，用于鼠标事件处理
    chart.setAttribute('data-logical-width', width.toString());
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 重置柱子区域信息
    barRegions = [];
    
    if (Object.keys(data).length === 0) {
        ctx.fillStyle = '#6B7280';
        ctx.font = '14px -apple-system';
        ctx.textAlign = 'center';
        ctx.fillText('No data available', width / 2, height / 2);
        return;
    }
    
    // 可以选择显示番茄数或分钟数，默认显示番茄数
    const values = Object.values(data).map(d => d.pomodoros);
    const maxValue = Math.max(...values, 1);
    
    const padding = { top: 20, right: 20, bottom: 50, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const sortedEntries = Object.entries(data).sort((a, b) => {
        const aData = a[1];
        const bData = b[1];
        if (aData.sortKey !== undefined && bData.sortKey !== undefined) {
            return aData.sortKey - bData.sortKey;
        }
        if (aData.date && bData.date) {
            return aData.date - bData.date;
        }
        return a[0].localeCompare(b[0]);
    });
    const sortedLabels = sortedEntries.map(e => e[0]);
    const barSpacing = chartWidth / Math.max(sortedLabels.length, 1);
    const barWidth = barSpacing * 0.6; // 柱子宽度为间距的60%
    
    // 绘制Y轴和网格线
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    
    // Y轴和X轴
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, height - padding.bottom);
    ctx.lineTo(width - padding.right, height - padding.bottom);
    ctx.stroke();
    
    // 绘制网格线
    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i;
        ctx.strokeStyle = '#F3F4F6';
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        // Y轴标签
        const value = Math.round(maxValue * (1 - i / gridLines));
        ctx.fillStyle = '#6B7280';
        ctx.font = '11px -apple-system';
        ctx.textAlign = 'right';
        ctx.fillText(value.toString(), padding.left - 10, y + 4);
    }
    
    // 使用之前已经排序好的sortedLabels
    const sortedPomodoroValues = sortedLabels.map(key => data[key].pomodoros);
    const sortedMinuteValues = sortedLabels.map(key => data[key].minutes);
    
    // 绘制柱状图
    sortedLabels.forEach((label, index) => {
        const pomodoroValue = sortedPomodoroValues[index];
        const minuteValue = sortedMinuteValues[index];
        const barHeight = (pomodoroValue / maxValue) * chartHeight;
        const x = padding.left + index * barSpacing + (barSpacing - barWidth) / 2;
        const y = height - padding.bottom - barHeight;
        
        // 柱状图渐变 - 使用 shadcn 风格的颜色渐变
        const gradient = ctx.createLinearGradient(x, y, x, height - padding.bottom);
        gradient.addColorStop(0, 'hsl(229.7, 93.5%, 81.8%)');  // 浅色端
        gradient.addColorStop(1, 'hsl(234.5, 89.5%, 73.9%)');  // 深色端
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 存储柱子区域信息，用于鼠标悬停检测
        barRegions.push({
            x: x,
            y: y,
            width: barWidth,
            height: barHeight,
            label: label,
            pomodoros: pomodoroValue,
            minutes: minuteValue,
            timeText: formatTime(minuteValue)
        });
        
        // X轴标签
        ctx.fillStyle = '#6B7280';
        ctx.font = '11px -apple-system';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth / 2, height - padding.bottom + 20);
        // 如果标签太长，旋转45度
        if (label.length > 8) {
            ctx.rotate(-Math.PI / 4);
        }
        ctx.fillText(label, 0, 0);
        ctx.restore();
    });
    
    // 图表标题
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 12px -apple-system';
    ctx.textAlign = 'left';
    ctx.fillText('Pomodoros', padding.left, padding.top - 5);
    
    // 添加鼠标事件监听
    setupChartMouseEvents(chart, padding);
}

// 设置图表鼠标事件
function setupChartMouseEvents(chart, padding) {
    // 移除旧的事件监听器（如果存在）
    chart.removeEventListener('mousemove', handleChartMouseMove);
    chart.removeEventListener('mouseleave', handleChartMouseLeave);
    
    // 添加新的事件监听器
    chart.addEventListener('mousemove', handleChartMouseMove);
    chart.addEventListener('mouseleave', handleChartMouseLeave);
}

// 处理图表鼠标移动事件
function handleChartMouseMove(e) {
    const chart = getHistoryChart();
    if (!chart) {
        return;
    }
    
    if (barRegions.length === 0) {
        // 没有数据时，隐藏 tooltip
        hideTooltip();
        chart.style.cursor = 'default';
        return;
    }
    
    const rect = chart.getBoundingClientRect();
    const logicalWidth = parseFloat(chart.getAttribute('data-logical-width')) || rect.width || 800;
    const logicalHeight = 300;
    
    // 将鼠标坐标转换为逻辑坐标
    const x = (e.clientX - rect.left) * (logicalWidth / rect.width);
    const y = (e.clientY - rect.top) * (logicalHeight / rect.height);
    
    // 检查鼠标是否在某个柱子上
    for (const bar of barRegions) {
        if (x >= bar.x && x <= bar.x + bar.width && 
            y >= bar.y && y <= bar.y + bar.height) {
            // 鼠标在柱子上，显示 tooltip
            const tooltipX = e.clientX + 10;
            const tooltipY = e.clientY - 30;
            showTooltip(tooltipX, tooltipY, bar.timeText);
            
            // 改变鼠标样式为指针
            chart.style.cursor = 'pointer';
            return;
        }
    }
    
    // 鼠标不在任何柱子上
    hideTooltip();
    chart.style.cursor = 'default';
}

// 处理图表鼠标离开事件
function handleChartMouseLeave() {
    hideTooltip();
    const chart = getHistoryChart();
    if (chart) {
        chart.style.cursor = 'default';
    }
}

function renderHistory() {
    const filteredHistory = getFilteredHistory();
    
    // 调试信息
    console.log('Total history records:', state.history.length);
    console.log('Filtered history:', filteredHistory);
    
    // 确保chart元素存在
    const chart = getHistoryChart();
    if (!chart) {
        console.warn('Chart element not ready, retrying...');
        setTimeout(renderHistory, 100);
        return;
    }
    
    // 绘制图表
    if (filteredHistory.length > 0) {
        const groupedData = groupHistoryByDate(filteredHistory);
        console.log('Grouped data for chart:', groupedData);
        drawChart(groupedData);
    } else {
        console.log('No filtered history, drawing empty chart');
        drawChart({});
    }
    
    // 显示列表和统计信息
    historyList.innerHTML = '';
    
    if (filteredHistory.length === 0) {
        historyList.innerHTML = '<div style="text-align: center; color: var(--text-light); padding: 20px;">No history for this period. Complete some pomodoros to see your progress!</div>';
        return;
    }
    
    // 计算汇总统计
    const totalPomodoros = filteredHistory.reduce((sum, r) => sum + (r.pomodoros || 0), 0);
    const totalTasks = filteredHistory.reduce((sum, r) => sum + (r.completedTodos || 0), 0);
    const totalMinutes = filteredHistory.reduce((sum, r) => sum + (r.minutes || 0), 0);
    const avgPomodoros = (totalPomodoros / filteredHistory.length).toFixed(1);
    const avgMinutes = (totalMinutes / filteredHistory.length).toFixed(0);
    
    // 添加汇总统计卡片
    const summaryDiv = document.createElement('div');
    summaryDiv.style.cssText = 'background: #F3F4F6; border-radius: 10px; padding: 16px; margin-bottom: 16px; border: 1px solid var(--border-color);';
    summaryDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; text-align: center;">
            <div>
                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-color);">${totalPomodoros}</div>
                <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 4px;">Total Pomodoros</div>
                <div style="font-size: 0.7rem; color: var(--text-light); margin-top: 2px;">Avg: ${avgPomodoros}/day</div>
            </div>
            <div>
                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-color);">${totalTasks}</div>
                <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 4px;">Total Tasks</div>
            </div>
            <div>
                <div style="font-size: 1.1rem; font-weight: 600; color: var(--text-color);">${totalMinutes}</div>
                <div style="font-size: 0.75rem; color: var(--text-light); margin-top: 4px;">Total Minutes</div>
                <div style="font-size: 0.7rem; color: var(--text-light); margin-top: 2px;">Avg: ${avgMinutes}min/day</div>
            </div>
        </div>
    `;
    historyList.appendChild(summaryDiv);
    
    // 按日期分组显示
    const grouped = groupHistoryByDate(filteredHistory);
    const sortedLabels = Object.keys(grouped).sort((a, b) => {
        // 按sortKey排序，如果没有则按日期排序
        const aData = grouped[a];
        const bData = grouped[b];
        if (aData.sortKey !== undefined && bData.sortKey !== undefined) {
            return aData.sortKey - bData.sortKey;
        }
        if (aData.date && bData.date) {
            return aData.date - bData.date;
        }
        return a.localeCompare(b);
    });
    
    sortedLabels.forEach(label => {
        const data = grouped[label];
        const div = document.createElement('div');
        div.className = 'history-item';
        
        // 格式化分钟显示
        const hours = Math.floor(data.minutes / 60);
        const mins = data.minutes % 60;
        const timeDisplay = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
        
        div.innerHTML = `
            <span class="history-date">${label}</span>
            <span class="history-stats">
                ${data.pomodoros} pomodoros • ${data.tasks} tasks • ${timeDisplay}
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

