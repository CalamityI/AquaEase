// State management
let state = {
    currentAmount: 0,
    dailyGoal: 80,
    history: [],
    streak: 0,
    totalWater: 0,
    lastResetDate: null,
    theme: localStorage.getItem('theme') || 'light',
    hasCompletedSetup: localStorage.getItem('hasCompletedSetup') === 'true',
    achievements: {
        'first-drink': { unlocked: true, progress: 100 },
        'streak-7': { unlocked: false, progress: 0 },
        'goal-master': { unlocked: false, progress: 0 }
    },
    journal: [],
    plant: {
        hydration: 75,
        growthStage: 2,
        lastWatered: null
    },
    healthIntegrations: {
        apple: false,
        google: false,
        fitbit: false
    },
    beverageType: 'water'
};

// DOM Elements
const currentAmountElement = document.getElementById('currentAmount');
const dailyGoalInput = document.getElementById('dailyGoal');
const progressCircleFill = document.querySelector('.progress-circle-fill');
const streakCountElement = document.getElementById('streakCount');
const historyList = document.getElementById('historyList');
const resetBtn = document.getElementById('resetBtn');
const resetStreakBtn = document.getElementById('resetStreakBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const customAmountInput = document.getElementById('customAmount');
const addCustomBtn = document.getElementById('addCustomBtn');
const progressPercentageElement = document.getElementById('progressPercentage');
const totalWaterElement = document.getElementById('totalWater');
const welcomeModal = document.getElementById('welcomeModal');
const userInfoForm = document.getElementById('userInfoForm');
const bottleVisuals = document.querySelectorAll('.bottle-visual');

// Tab Navigation
const navTabs = document.querySelectorAll('.nav-tab');
const tabContents = document.querySelectorAll('.tab-content');

navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Update active tab
        navTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show target content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === `${targetTab}-tab`) {
                content.classList.add('active');
            }
        });
    });
});

// Beverage Type Selection
const beverageButtons = document.querySelectorAll('.beverage-btn');
beverageButtons.forEach(button => {
    button.addEventListener('click', () => {
        beverageButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        state.beverageType = button.dataset.type;
    });
});

// Load state from localStorage
function loadState() {
    const savedState = localStorage.getItem('waterTrackerState');
    if (savedState) {
        const parsedState = JSON.parse(savedState);
        state = { ...state, ...parsedState };
        updateUI();
        updateTheme();
        updateAchievements();
        updateJournalEntries();
        updateHealthIntegrations();
        updatePlant();
    }
}

// Save state to localStorage
function saveState() {
    localStorage.setItem('waterTrackerState', JSON.stringify({
        currentAmount: state.currentAmount,
        dailyGoal: state.dailyGoal,
        history: state.history,
        streak: state.streak,
        totalWater: state.totalWater,
        lastResetDate: state.lastResetDate,
        achievements: state.achievements,
        journal: state.journal,
        plant: state.plant,
        healthIntegrations: state.healthIntegrations
    }));
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('hasCompletedSetup', state.hasCompletedSetup);
}

// Update UI elements
function updateUI() {
    currentAmountElement.textContent = state.currentAmount;
    dailyGoalInput.value = state.dailyGoal;
    streakCountElement.textContent = state.streak;
    totalWaterElement.textContent = state.totalWater;
    
    // Update progress circle and percentage
    const percentage = Math.min((state.currentAmount / state.dailyGoal) * 100, 100);
    progressCircleFill.style.height = `${percentage}%`;
    progressPercentageElement.textContent = `${Math.round(percentage)}%`;
    
    // Update history list
    updateHistoryList();
    
    // Update theme icon
    themeToggleBtn.innerHTML = `<i class="fas fa-${state.theme === 'dark' ? 'sun' : 'moon'}"></i>`;
    
    // Update bottle visuals
    updateBottleVisuals();
}

// Update history list
function updateHistoryList() {
    historyList.innerHTML = '';
    state.history.forEach((entry, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <span>${entry.amount} oz</span>
            <span>${entry.time}</span>
        `;
        historyList.appendChild(historyItem);
    });
}

// Add water intake
function addWater(amount) {
    state.currentAmount += amount;
    state.totalWater += amount;
    state.history.push({
        amount,
        time: new Date().toLocaleTimeString(),
        type: state.beverageType
    });
    
    // Update plant hydration
    state.plant.hydration = Math.min(100, state.plant.hydration + (amount / state.dailyGoal) * 25);
    state.plant.lastWatered = new Date().toISOString();
    
    // Check if goal is met
    if (state.currentAmount >= state.dailyGoal && state.currentAmount - amount < state.dailyGoal) {
        state.streak++;
        showNotification('Congratulations! You met your daily goal! 🎉');
    }
    
    checkAchievements();
    saveState();
    updateUI();
    updatePlant();
}

// Reset progress
function resetProgress() {
    state.currentAmount = 0;
    state.history = [];
    saveState();
    updateUI();
    showNotification('Progress reset for today');
}

// Reset streak
function resetStreak() {
    state.streak = 0;
    saveState();
    updateUI();
    showNotification('Streak reset');
}

// Clear history
function clearHistory() {
    state.history = [];
    saveState();
    updateUI();
    showNotification('History cleared');
}

// Check for midnight reset
function checkMidnightReset() {
    const now = new Date();
    const lastReset = state.lastResetDate ? new Date(state.lastResetDate) : null;
    
    if (!lastReset || now.getDate() !== lastReset.getDate()) {
        state.currentAmount = 0;
        state.history = [];
        state.lastResetDate = now.toISOString();
        
        // Update streak
        if (lastReset) {
            const daysSinceLastReset = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));
            if (daysSinceLastReset === 1) {
                state.streak++;
            } else if (daysSinceLastReset > 1) {
                state.streak = 1;
            }
        } else {
            state.streak = 1;
        }
        
        saveState();
    }
}

// Toggle theme
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    updateTheme();
    updateUI();
    showNotification(`Switched to ${state.theme} mode`);
}

// Update theme
function updateTheme() {
    document.body.setAttribute('data-theme', state.theme);
    const themeIcon = document.querySelector('#themeToggleBtn i');
    themeIcon.className = state.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    state.theme = savedTheme;
    updateTheme();
}

// Show notification
function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, duration);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadState();
    checkMidnightReset();
    initializeTheme();
    
    if (!state.hasCompletedSetup) {
        showWelcomeModal();
    }
    
    updateUI();
    
    // Welcome modal form submission
    document.getElementById('userInfoForm').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const age = parseInt(document.getElementById('age').value);
        const gender = document.getElementById('gender').value;
        const weight = parseInt(document.getElementById('weight').value);
        const activity = document.getElementById('activity').value;
        
        const recommendedIntake = calculateWaterIntake(age, gender, weight, activity);
        state.dailyGoal = recommendedIntake;
        state.hasCompletedSetup = true;
        
        saveState();
        hideWelcomeModal();
        updateUI();
        showNotification(`Your personalized daily water intake goal is ${recommendedIntake} oz`);
    });
    
    // Get recommendation button
    document.getElementById('getRecommendationBtn').addEventListener('click', () => {
        showWelcomeModal();
    });
    
    // Quick add buttons
    document.querySelectorAll('.add-water').forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.dataset.amount);
            state.currentAmount += amount;
            state.totalWater += amount;
            state.history.unshift({
                amount,
                time: new Date().toLocaleTimeString()
            });
            
            saveState();
            updateUI();
            showNotification(`Added ${amount} oz of water`);
        });
    });
    
    // Custom amount input
    document.getElementById('addCustomBtn').addEventListener('click', () => {
        const input = document.getElementById('customAmount');
        const amount = parseInt(input.value);
        
        if (amount && amount > 0) {
            state.currentAmount += amount;
            state.totalWater += amount;
            state.history.unshift({
                amount,
                time: new Date().toLocaleTimeString()
            });
            
            input.value = '';
            saveState();
            updateUI();
            showNotification(`Added ${amount} oz of water`);
        }
    });
    
    // Preset goals
    document.querySelectorAll('.preset-goal').forEach(button => {
        button.addEventListener('click', () => {
            const amount = parseInt(button.dataset.amount);
            state.dailyGoal = amount;
            saveState();
            updateUI();
            showNotification(`Daily goal set to ${amount} oz`);
        });
    });
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', () => {
        state.currentAmount = 0;
        state.history = [];
        saveState();
        updateUI();
        showNotification('Progress reset for today');
    });
    
    // Reset streak button
    document.getElementById('resetStreakBtn').addEventListener('click', () => {
        state.streak = 0;
        saveState();
        updateUI();
        showNotification('Streak reset');
    });
    
    // Clear history button
    document.getElementById('clearHistoryBtn').addEventListener('click', () => {
        state.history = [];
        saveState();
        updateUI();
        showNotification('History cleared');
    });
    
    // Theme toggle
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
});

// Calculate recommended water intake based on user info
function calculateWaterIntake(age, gender, weight, activity) {
    // Base calculation: 30-35 ml per kg of body weight
    let baseAmount = weight * 0.453592 * 30; // Convert lbs to kg and calculate ml
    
    // Adjust for age
    if (age < 18) {
        baseAmount *= 0.8; // 20% less for children
    } else if (age > 65) {
        baseAmount *= 0.9; // 10% less for elderly
    }
    
    // Adjust for gender
    if (gender === 'female') {
        baseAmount *= 0.9; // 10% less for females
    }
    
    // Adjust for activity level
    switch (activity) {
        case 'sedentary':
            baseAmount *= 1.0;
            break;
        case 'moderate':
            baseAmount *= 1.2;
            break;
        case 'active':
            baseAmount *= 1.4;
            break;
        case 'very_active':
            baseAmount *= 1.6;
            break;
    }
    
    // Convert ml to oz and round to nearest 8 oz
    let ozAmount = Math.round(baseAmount / 29.5735 / 8) * 8;
    
    // Ensure minimum of 64 oz and maximum of 128 oz
    return Math.min(Math.max(ozAmount, 64), 128);
}

// Show welcome modal
function showWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    modal.classList.add('show');
}

// Hide welcome modal
function hideWelcomeModal() {
    const modal = document.getElementById('welcomeModal');
    modal.classList.remove('show');
}

// Update bottle visuals
function updateBottleVisuals() {
    bottleVisuals.forEach(visual => {
        const amount = parseInt(visual.dataset.amount);
        const fill = visual.querySelector('.bottle-fill');
        const percentage = Math.min((state.currentAmount / state.dailyGoal) * 100, 100);
        fill.style.height = `${percentage}%`;
    });
}

// Plant Growth System
function updatePlant() {
    const plant = document.querySelector('.plant-visual');
    const healthStatus = document.querySelector('.plant-health');
    const hydrationLevel = document.querySelector('.plant-stats .stat:first-child span');
    const growthStage = document.querySelector('.plant-stats .stat:last-child span');
    
    // Update plant appearance based on hydration
    const hydrationPercentage = state.plant.hydration;
    const stemHeight = 150 + (hydrationPercentage - 50) * 2;
    const leavesSize = 100 + (hydrationPercentage - 50);
    
    plant.querySelector('.stem').style.height = `${stemHeight}px`;
    plant.querySelector('.leaves').style.width = `${leavesSize}px`;
    plant.querySelector('.leaves').style.height = `${leavesSize}px`;
    
    // Update status text
    healthStatus.textContent = hydrationPercentage > 70 ? 'healthy' : 
                              hydrationPercentage > 40 ? 'needs water' : 'wilting';
    healthStatus.className = `plant-health ${healthStatus.textContent.replace(' ', '-')}`;
    
    // Update stats
    hydrationLevel.textContent = `Hydration Level: ${hydrationPercentage}%`;
    growthStage.textContent = `Growth Stage: ${state.plant.growthStage}`;
}

// Journal System
const journalForm = document.getElementById('journalForm');
const journalEntries = document.getElementById('journalEntries');

journalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const entry = {
        date: document.getElementById('entryDate').value,
        energyLevel: document.getElementById('energyLevel').value,
        headache: document.getElementById('headache').value,
        notes: document.getElementById('notes').value,
        timestamp: new Date().toISOString()
    };
    
    state.journal.unshift(entry);
    saveState();
    updateJournalEntries();
    journalForm.reset();
    showNotification('Journal entry saved');
});

function updateJournalEntries() {
    journalEntries.innerHTML = '';
    state.journal.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'journal-entry-item';
        entryElement.innerHTML = `
            <div class="entry-header">
                <span class="entry-date">${new Date(entry.date).toLocaleDateString()}</span>
                <span class="entry-time">${new Date(entry.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="entry-content">
                <div class="entry-stats">
                    <span>Energy: ${entry.energyLevel}/5</span>
                    <span>Headache: ${entry.headache}</span>
                </div>
                <p class="entry-notes">${entry.notes}</p>
            </div>
        `;
        journalEntries.appendChild(entryElement);
    });
}

// Health Integration
const integrationButtons = document.querySelectorAll('.integration-btn');
const connectedServices = document.getElementById('connectedServices');

integrationButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const provider = button.dataset.provider;
        
        try {
            // Simulate health integration (in a real app, this would use actual APIs)
            await connectHealthProvider(provider);
            state.healthIntegrations[provider] = true;
            saveState();
            updateHealthIntegrations();
            showNotification(`Connected to ${provider} successfully`);
        } catch (error) {
            showNotification(`Failed to connect to ${provider}`, 'error');
        }
    });
});

async function connectHealthProvider(provider) {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(resolve, 1000);
    });
}

function updateHealthIntegrations() {
    connectedServices.innerHTML = '';
    Object.entries(state.healthIntegrations).forEach(([provider, connected]) => {
        if (connected) {
            const serviceElement = document.createElement('div');
            serviceElement.className = 'connected-service';
            serviceElement.innerHTML = `
                <i class="fab fa-${provider}"></i>
                <span>${provider.charAt(0).toUpperCase() + provider.slice(1)}</span>
            `;
            connectedServices.appendChild(serviceElement);
        }
    });
}

// Achievement System
function checkAchievements() {
    // First drink achievement
    if (state.history.length > 0 && !state.achievements['first-drink'].unlocked) {
        unlockAchievement('first-drink');
    }
    
    // Streak achievement
    if (state.streak >= 7 && !state.achievements['streak-7'].unlocked) {
        unlockAchievement('streak-7');
    }
    
    // Goal master achievement
    const goalMetCount = state.history.filter(entry => entry.amount >= state.dailyGoal).length;
    state.achievements['goal-master'].progress = Math.min((goalMetCount / 5) * 100, 100);
    if (goalMetCount >= 5 && !state.achievements['goal-master'].unlocked) {
        unlockAchievement('goal-master');
    }
    
    updateAchievements();
}

function unlockAchievement(achievementId) {
    state.achievements[achievementId].unlocked = true;
    state.achievements[achievementId].progress = 100;
    showNotification(`Achievement unlocked: ${achievementId.replace('-', ' ')}`);
}

function updateAchievements() {
    Object.entries(state.achievements).forEach(([id, achievement]) => {
        const card = document.querySelector(`[data-achievement="${id}"]`);
        if (card) {
            const progressBar = card.querySelector('.progress');
            progressBar.style.width = `${achievement.progress}%`;
            
            if (achievement.unlocked) {
                card.classList.add('unlocked');
            }
        }
    });
}

// Initialize
loadState();
checkMidnightReset();
showWelcomeModal();

// Check for midnight reset every minute
setInterval(checkMidnightReset, 60000); 