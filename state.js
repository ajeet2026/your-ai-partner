// state.js - Reactive State Manager with LocalStorage Persistence
const STATE_KEY = 'YOUR_AI_PARTNER_APP_STATE';
const TOKEN_KEY = 'YOUR_AI_PARTNER_JWT_TOKEN';
const EMAIL_KEY = 'YOUR_AI_PARTNER_EMAIL';

const DEFAULT_STATE = {
    onboarded: false,
    user: {
        name: '',
        age: '',
        classYear: '',
        stream: '',
        targetExam: '',
        schoolCollege: '',
        currentMarks: '',
        weakSubjects: [],
        strongSubjects: [],
        studyHours: 4,
        sleepSchedule: '22:00 - 06:00',
        preferredLanguage: 'English',
        stressLevel: 5,
        careerGoal: ''
    },
    tasks: [
        // Default onboarding/intro tasks
        { id: 't1', title: 'Complete Diagnostic Assessment', subject: 'General', category: 'onboarding', completed: false, deadline: 'Today', studyHours: 0.5 },
        { id: 't2', title: 'Create Custom Weekly Study Schedule', subject: 'General', category: 'planning', completed: false, deadline: 'Tomorrow', studyHours: 0.5 },
        { id: 't3', title: 'Introduce yourself to the Tutor Agent', subject: 'General', category: 'tutoring', completed: false, deadline: 'Today', studyHours: 0.2 }
    ],
    stats: {
        streak: 0,
        level: 1,
        xp: 0,
        testsCompleted: 0,
        totalStudyMinutes: 0,
        lastActiveDate: null
    },
    tests: [],
    moodLog: [],
    chatHistory: [
        {
            id: 'c1',
            sender: 'ai',
            agent: 'Tutor',
            text: "Hello! I am your AI Partner and learning tutor. I can explain complex academic concepts in simple terms, solve doubts step-by-step, or teach you in English, Hindi, or Bengali! Choose your subject, and let's get started.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ],
    unlockedBadges: ['Welcome Explorer']
};

class StateManager {
    constructor() {
        this.token = localStorage.getItem(TOKEN_KEY) || null;
        this.email = localStorage.getItem(EMAIL_KEY) || null;
        this.isGuest = localStorage.getItem('YOUR_AI_PARTNER_IS_GUEST') === 'true';
        this.state = this.loadState();
        this.listeners = [];
        this.syncStatus = this.token ? 'syncing' : 'offline'; // 'offline', 'syncing', 'synced', 'error'
        this.verifyStreak();
        if (this.token) {
            this.loadFromDatabase(); // Background sync from secure FastAPI relational database
        }
    }

    setGuestMode(val) {
        this.isGuest = !!val;
        localStorage.setItem('YOUR_AI_PARTNER_IS_GUEST', val ? 'true' : 'false');
        this.notify();
    }

    async authenticatedFetch(url, options = {}) {
        if (!this.token) {
            throw new Error("No active authentication token present.");
        }
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${this.token}`
        };
        return fetch(url, options);
    }

    async signupUser(email, password, name) {
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Signup failed");
            }
            const data = await res.json();
            this.token = data.token;
            this.email = data.email;
            this.isGuest = false;
            localStorage.setItem(TOKEN_KEY, this.token);
            localStorage.setItem(EMAIL_KEY, this.email);
            localStorage.removeItem('YOUR_AI_PARTNER_IS_GUEST');
            
            // Set onboarding name from signup form
            this.state.user.name = name || email.split("@")[0];
            
            // Reset local stats & state before loading, keeping our custom name
            const tempName = this.state.user.name;
            this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
            this.state.user.name = tempName;
            
            this.syncStatus = 'synced';
            // Save initial empty/basic profile with name to database
            await this.saveProfileToDatabase();
            
            await this.loadFromDatabase();
            this.notify();
            return { success: true };
        } catch (e) {
            console.error("Signup error:", e);
            return { success: false, error: e.message };
        }
    }

    async loginUser(email, password) {
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Login failed");
            }
            const data = await res.json();
            this.token = data.token;
            this.email = data.email;
            this.isGuest = false;
            localStorage.setItem(TOKEN_KEY, this.token);
            localStorage.setItem(EMAIL_KEY, this.email);
            localStorage.removeItem('YOUR_AI_PARTNER_IS_GUEST');
            
            this.syncStatus = 'synced';
            await this.loadFromDatabase();
            this.notify();
            return { success: true };
        } catch (e) {
            console.error("Login error:", e);
            return { success: false, error: e.message };
        }
    }

    signOutUser() {
        this.token = null;
        this.email = null;
        this.isGuest = false;
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(EMAIL_KEY);
        localStorage.removeItem('YOUR_AI_PARTNER_IS_GUEST');
        // Reset state to default state
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
        this.syncStatus = 'offline';
        this.notify();
    }

    async loadFromDatabase() {
        if (!this.token) {
            this.syncStatus = 'offline';
            this.notify();
            return;
        }

        this.syncStatus = 'syncing';
        this.notify();

        try {
            // Fetch profile
            const profileRes = await this.authenticatedFetch('/api/user/profile');
            if (!profileRes.ok) throw new Error("Failed to fetch profile");
            const profileData = await profileRes.json();
            
            if (profileData.success && profileData.profile) {
                const p = profileData.profile;
                this.state.user = {
                    ...this.state.user,
                    name: p.name || '',
                    targetExam: p.targetExam || '',
                    preferredLanguage: p.preferredLanguage || 'English',
                    studyHours: p.studyHours || 4,
                    weakSubjects: p.weakSubjects || [],
                    strongSubjects: p.strongSubjects || [],
                    skills: p.skills || {},
                    premium: p.premium || false
                };
                if (p.name || p.targetExam) {
                    this.state.onboarded = true;
                }
            }

            // Fetch tasks
            const tasksRes = await this.authenticatedFetch('/api/user/tasks');
            if (tasksRes.ok) {
                const tasksData = await tasksRes.json();
                if (tasksData.success) {
                    this.state.tasks = tasksData.tasks || [];
                }
            }

            // Fetch tests
            const testsRes = await this.authenticatedFetch('/api/user/tests');
            if (testsRes.ok) {
                const testsData = await testsRes.json();
                if (testsData.success) {
                    this.state.tests = testsData.tests || [];
                    this.state.stats.testsCompleted = this.state.tests.length;
                }
            }

            // Fetch mood logs
            const moodRes = await this.authenticatedFetch('/api/user/mood');
            if (moodRes.ok) {
                const moodData = await moodRes.json();
                if (moodData.success) {
                    this.state.moodLog = moodData.logs || [];
                }
            }

            // Fetch chat history
            const chatRes = await this.authenticatedFetch('/api/user/chat');
            if (chatRes.ok) {
                const chatData = await chatRes.json();
                if (chatData.success && chatData.chats && chatData.chats.length > 0) {
                    this.state.chatHistory = chatData.chats;
                }
            }

            this.syncStatus = 'synced';
            localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
            this.verifyStreak();
            console.log("💾 State successfully synchronized from FastAPI secure database!");
        } catch (e) {
            console.warn("Could not connect to secure database server, using offline storage:", e);
            this.syncStatus = 'error';
        }
        this.notify();
    }

    loadState() {
        try {
            const data = localStorage.getItem(STATE_KEY);
            if (!data) return JSON.parse(JSON.stringify(DEFAULT_STATE));
            
            const parsed = JSON.parse(data);
            // Merge defaults in case user updates schemas
            return { ...JSON.parse(JSON.stringify(DEFAULT_STATE)), ...parsed };
        } catch (e) {
            console.error("Error reading from localStorage, using default state:", e);
            return JSON.parse(JSON.stringify(DEFAULT_STATE));
        }
    }

    saveState() {
        try {
            localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
            this.notify();
            this.saveToDatabase();
        } catch (e) {
            console.error("Error saving state to localStorage:", e);
        }
    }

    async saveToDatabase() {
        if (!this.token) return;
        try {
            await this.saveProfileToDatabase();
        } catch (e) {
            console.error("Failed to sync state to database:", e);
            this.syncStatus = 'error';
            this.notify();
        }
    }

    async saveProfileToDatabase() {
        if (!this.token) return;
        try {
            const res = await this.authenticatedFetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: this.state.user.name || '',
                    targetExam: this.state.user.targetExam || '',
                    preferredLanguage: this.state.user.preferredLanguage || 'English',
                    studyHours: parseInt(this.state.user.studyHours) || 4,
                    weakSubjects: this.state.user.weakSubjects || [],
                    strongSubjects: this.state.user.strongSubjects || [],
                    skills: this.state.user.skills || {},
                    premium: this.state.user.premium || false
                })
            });
            if (res.ok) {
                this.syncStatus = 'synced';
            } else {
                this.syncStatus = 'error';
            }
        } catch (e) {
            this.syncStatus = 'error';
        }
        this.notify();
    }

    async addTaskToDatabase(task) {
        if (!this.token) return;
        try {
            await this.authenticatedFetch('/api/user/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: task.id,
                    title: task.title,
                    subject: task.subject || 'General',
                    category: task.category || 'planning',
                    completed: task.completed || false,
                    deadline: task.deadline || 'Today',
                    studyHours: parseFloat(task.studyHours) || 1.0
                })
            });
        } catch (e) {
            console.error("Error adding task to remote DB:", e);
        }
    }

    async toggleTaskInDatabase(taskId) {
        if (!this.token) return;
        try {
            await this.authenticatedFetch(`/api/user/tasks/toggle/${taskId}`, {
                method: 'POST'
            });
        } catch (e) {
            console.error("Error toggling task in remote DB:", e);
        }
    }

    async deleteTaskFromDatabase(taskId) {
        if (!this.token) return;
        try {
            await this.authenticatedFetch(`/api/user/tasks/${taskId}`, {
                method: 'DELETE'
            });
        } catch (e) {
            console.error("Error deleting task from remote DB:", e);
        }
    }

    async addTestToDatabase(test) {
        if (!this.token) return;
        try {
            await this.authenticatedFetch('/api/user/tests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: test.id,
                    subject: test.subject,
                    date: test.date,
                    score: parseInt(test.score) || 0,
                    total: parseInt(test.total) || 10,
                    percentage: parseInt(test.percentage) || 0,
                    accuracy: parseInt(test.accuracy) || 0,
                    timeSpent: parseInt(test.timeSpent) || 0
                })
            });
        } catch (e) {
            console.error("Error adding test to remote DB:", e);
        }
    }

    async addMoodLogToDatabase(mood) {
        if (!this.token) return;
        try {
            await this.authenticatedFetch('/api/user/mood', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: mood.id,
                    date: mood.date,
                    mood: mood.mood,
                    stressLevel: parseInt(mood.stressLevel) || 5,
                    sleepHours: parseFloat(mood.sleepHours) || 8.0,
                    notes: mood.notes || ''
                })
            });
        } catch (e) {
            console.error("Error adding mood log to remote DB:", e);
        }
    }

    async addChatToDatabase(chat) {
        if (!this.token) return;
        try {
            await this.authenticatedFetch('/api/user/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: chat.id,
                    sender: chat.sender,
                    agent: chat.agent || 'Tutor',
                    text: chat.text,
                    time: chat.time
                })
            });
        } catch (e) {
            console.error("Error adding chat to remote DB:", e);
        }
    }

    async clearChatsFromDatabase() {
        if (!this.token) return;
        try {
            await this.authenticatedFetch('/api/user/chat', {
                method: 'DELETE'
            });
        } catch (e) {
            console.error("Error clearing chats in remote DB:", e);
        }
    }

    resetState() {
        this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        this.saveState();
    }

    getState() {
        return this.state;
    }

    updateUser(userData) {
        this.state.user = { ...this.state.user, ...userData };
        this.saveState();
        if (this.token) {
            this.saveProfileToDatabase();
        }
    }

    completeOnboarding(userData, skills) {
        this.state.user = { ...this.state.user, ...userData };
        this.state.user.skills = skills;
        this.state.onboarded = true;
        
        // Generate custom tasks based on weak subjects
        this.generateInitialTasks();
        this.addXP(100); // Onboarding reward!
        this.unlockBadge('Strategic Starter');
        
        this.saveState();
        if (this.token) {
            this.saveProfileToDatabase();
            // Pushing newly generated tasks to remote DB
            this.state.tasks.forEach(task => {
                this.addTaskToDatabase(task);
            });
        }
    }

    generateInitialTasks() {
        const weak = this.state.user.weakSubjects;
        const exam = this.state.user.targetExam;
        
        const generated = [
            { id: 't_init1', title: `Review Syllabus for ${exam}`, subject: 'General', category: 'planning', completed: false, deadline: 'Today', studyHours: 1.0 }
        ];

        weak.forEach((subj, idx) => {
            generated.push({
                id: `t_weak_${idx}`,
                title: `Master fundamentals of ${subj} (Priority Topic)`,
                subject: subj,
                category: 'tutoring',
                completed: false,
                deadline: `In ${idx + 2} Days`,
                studyHours: 2.0
            });
        });

        // Keep core uncompleted onboarding tasks, then add new generated ones
        this.state.tasks = [
            ...this.state.tasks.filter(t => !t.completed && t.category !== 'onboarding'),
            ...generated
        ];
    }

    addTask(task) {
        const newTask = {
            id: 'task_' + Date.now(),
            completed: false,
            studyHours: 1,
            ...task
        };
        this.state.tasks.push(newTask);
        this.saveState();
        if (this.token) {
            this.addTaskToDatabase(newTask);
        }
        return newTask;
    }

    toggleTask(taskId) {
        const task = this.state.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            if (task.completed) {
                this.addXP(25);
                this.state.stats.totalStudyMinutes += (task.studyHours || 1) * 60;
                this.checkStudyMilestones();
            } else {
                this.addXP(-25);
                this.state.stats.totalStudyMinutes -= (task.studyHours || 1) * 60;
            }
            this.saveState();
            if (this.token) {
                this.toggleTaskInDatabase(taskId);
                this.saveProfileToDatabase(); // Save profile stats XP
            }
        }
    }

    deleteTask(taskId) {
        this.state.tasks = this.state.tasks.filter(t => t.id !== taskId);
        this.saveState();
        if (this.token) {
            this.deleteTaskFromDatabase(taskId);
        }
    }

    addTestResult(result) {
        const newResult = {
            id: 'test_' + Date.now(),
            date: new Date().toLocaleDateString(),
            ...result
        };
        this.state.tests.push(newResult);
        this.state.stats.testsCompleted += 1;
        this.addXP(50 + Math.round(result.score * 0.5)); // XP based on performance
        this.checkTestMilestones();
        this.saveState();
        if (this.token) {
            this.addTestToDatabase(newResult);
            this.saveProfileToDatabase(); // Save profile stats XP
        }
        return newResult;
    }

    addMoodLog(log) {
        const newLog = {
            id: 'mood_' + Date.now(),
            date: new Date().toLocaleDateString(),
            timestamp: new Date().toISOString(),
            ...log
        };
        this.state.moodLog.push(newLog);
        this.addXP(15); // Rewards for self-awareness!
        this.saveState();
        if (this.token) {
            this.addMoodLogToDatabase(newLog);
            this.saveProfileToDatabase(); // Save profile stats XP
        }
        return newLog;
    }

    addChatMessage(sender, text, agent = 'Tutor') {
        const newMessage = {
            id: 'chat_' + Date.now(),
            sender,
            agent,
            text,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        this.state.chatHistory.push(newMessage);
        this.saveState();
        if (this.token) {
            this.addChatToDatabase(newMessage);
        }
        return newMessage;
    }

    clearChat() {
        this.state.chatHistory = [
            this.state.chatHistory[0] // Preserve intro message
        ];
        this.saveState();
        if (this.token) {
            this.clearChatsFromDatabase();
        }
    }

    addXP(amount) {
        this.state.stats.xp = Math.max(0, this.state.stats.xp + amount);
        
        // Dynamic Level Calculation: level = 1 + floor(sqrt(xp / 100))
        const newLevel = 1 + Math.floor(Math.sqrt(this.state.stats.xp / 100));
        if (newLevel > this.state.stats.level) {
            this.state.stats.level = newLevel;
            this.unlockBadge(`Level ${newLevel} Achiever`);
        }
        this.saveState();
    }

    unlockBadge(badgeName) {
        if (!this.state.unlockedBadges.includes(badgeName)) {
            this.state.unlockedBadges.push(badgeName);
            // Dynamic alert triggers can be added here
        }
    }

    verifyStreak() {
        const todayStr = new Date().toDateString();
        const lastActive = this.state.stats.lastActiveDate;
        
        if (!lastActive) {
            this.state.stats.streak = 1;
            this.state.stats.lastActiveDate = todayStr;
            this.saveState();
            return;
        }

        if (lastActive === todayStr) return; // Already updated today

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();

        if (lastActive === yesterdayStr) {
            this.state.stats.streak += 1;
            this.unlockBadge('Consistent Comrade');
            if (this.state.stats.streak >= 7) this.unlockBadge('Streak Master (7 Days)');
            if (this.state.stats.streak >= 30) this.unlockBadge('Unstoppable Sage (30 Days)');
        } else {
            // Streak broken, reset
            this.state.stats.streak = 1;
        }
        
        this.state.stats.lastActiveDate = todayStr;
        this.saveState();
    }

    checkStudyMilestones() {
        const hrs = this.state.stats.totalStudyMinutes / 60;
        if (hrs >= 1) this.unlockBadge('First Step Taken');
        if (hrs >= 10) this.unlockBadge('Deep Focus Disciple');
        if (hrs >= 50) this.unlockBadge('Scholarly Giant');
    }

    checkTestMilestones() {
        const tests = this.state.stats.testsCompleted;
        if (tests >= 1) this.unlockBadge('Fearless Examiner');
        if (tests >= 5) this.unlockBadge('Analytical Alchemist');
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

// Global Single Instance
window.AppStore = new StateManager();
