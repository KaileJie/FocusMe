// Quick script to generate test data for preview
// Run this in browser console or Node.js

const generateTestData = () => {
    const today = new Date();
    const history = [];
    
    // Generate data for the past 7 days with varying pomodoro counts
    const testData = [
        { dayOffset: 6, pomodoros: 8, tasks: 5, minutes: 200 },  // Monday
        { dayOffset: 5, pomodoros: 12, tasks: 8, minutes: 300 }, // Tuesday
        { dayOffset: 4, pomodoros: 6, tasks: 4, minutes: 150 },  // Wednesday
        { dayOffset: 3, pomodoros: 10, tasks: 6, minutes: 250 }, // Thursday
        { dayOffset: 2, pomodoros: 14, tasks: 10, minutes: 350 }, // Friday
        { dayOffset: 1, pomodoros: 4, tasks: 2, minutes: 100 },  // Saturday
        { dayOffset: 0, pomodoros: 2, tasks: 1, minutes: 50 },   // Sunday (today)
    ];
    
    testData.forEach(({ dayOffset, pomodoros, tasks, minutes }) => {
        const date = new Date(today);
        date.setDate(date.getDate() - dayOffset);
        date.setHours(0, 0, 0, 0);
        
        history.push({
            date: date.toDateString(),
            pomodoros: pomodoros,
            completedTodos: tasks,
            minutes: minutes
        });
    });
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
        localStorage.setItem('focusMeHistory', JSON.stringify(history));
        
        const todayData = testData[testData.length - 1];
        localStorage.setItem('focusMeStats', JSON.stringify({
            pomodoros: todayData.pomodoros,
            completedTodos: todayData.tasks,
            minutes: todayData.minutes
        }));
        
        console.log('✅ Test data generated!');
        console.log('History:', history);
        return true;
    }
    return false;
};

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = generateTestData;
} else {
    window.generateTestData = generateTestData;
}

