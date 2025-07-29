// ES6 Module
console.log("Learning Nugget Previewer script loaded.");

// ===========================
// SUPABASE CONFIGURATION
// ===========================

// Initialize Supabase client
const SUPABASE_URL = 'https://hvfbibsjabcuqjmrdmtd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2ZmJpYnNqYWJjdXFqbXJkbXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MTk5OTYsImV4cCI6MjA2OTM5NTk5Nn0.piwg5dlJRMz9P6LDje_yKZ2MZznm5wpj2VElnyhPFz4';

let supabase;
if (typeof window !== 'undefined' && window.supabase) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('Supabase client initialized successfully');
} else {
    console.warn('Supabase not available - running in offline mode');
}

// ===========================
// AUTHENTICATION MANAGER
// ===========================

class AuthManager {
    constructor() {
        this.user = null;
        this.profile = null;
        this.isInitialized = false;
        this.authMode = 'signin'; // 'signin' or 'signup'
        
        if (supabase) {
            this.initializeAuth();
        } else {
            this.isInitialized = true;
            this.updateUI();
        }
    }

    async initializeAuth() {
        try {
            // Check existing session
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            
            if (session) {
                this.user = session.user;
                await this.loadUserProfile();
                await this.syncLocalProgress();
            }

            // Listen for auth changes
            supabase.auth.onAuthStateChange(async (event, session) => {
                console.log('Auth state changed:', event);
                
                if (event === 'SIGNED_IN') {
                    this.user = session.user;
                    await this.loadUserProfile();
                    this.showSuccessMessage('Welcome back! 🎉');
                    await this.syncLocalProgress();
                } else if (event === 'SIGNED_OUT') {
                    this.user = null;
                    this.profile = null;
                    this.showSuccessMessage('Signed out successfully');
                }
                this.updateUI();
            });
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            this.isInitialized = true;
            this.updateUI();
        }
    }

    async signUp(email, password, username) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { username: username || email.split('@')[0] }
                }
            });

            if (error) throw error;

            if (data.user) {
                await this.createUserProfile(data.user, username);
                this.showSuccessMessage('Account created! Please check your email to verify.');
                return { success: true, data };
            }
        } catch (error) {
            console.error('Sign up error:', error);
            this.showErrorMessage(error.message);
            return { success: false, error };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({ 
                email, 
                password 
            });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            this.showErrorMessage(error.message);
            return { success: false, error };
        }
    }

    async signInWithProvider(provider) {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error(`${provider} sign in error:`, error);
            this.showErrorMessage(`Failed to sign in with ${provider}`);
            return { success: false, error };
        }
    }

    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            this.showErrorMessage('Failed to sign out');
            return { success: false, error };
        }
    }

    async createUserProfile(user, username) {
        try {
            const { error } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    username: username || user.email.split('@')[0],
                    full_name: user.user_metadata.full_name || '',
                    avatar_url: user.user_metadata.avatar_url || ''
                });
            
            if (error && error.code !== '23505') { // Ignore duplicate key error
                throw error;
            }
            
            await this.loadUserProfile();
        } catch (error) {
            console.error('Profile creation error:', error);
        }
    }

    async loadUserProfile() {
        if (!this.user) return;

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', this.user.id)
                .single();

            if (!error) {
                this.profile = data;
            } else if (error.code === 'PGRST116') {
                // Profile doesn't exist, create it
                await this.createUserProfile(this.user);
            }
        } catch (error) {
            console.error('Profile loading error:', error);
        }
    }

    async syncLocalProgress() {
        if (!this.user) return;

        try {
            // Get all local progress
            const localProgress = ProgressTracker.getAllProgress();
            
            for (const [lessonKey, isCompleted] of Object.entries(localProgress)) {
                if (isCompleted && lessonKey.includes('.')) {
                    const parts = lessonKey.replace('lesson-completed-', '').split('.');
                    if (parts.length >= 4) {
                        const [courseId, pathId, moduleId, lessonId] = parts;
                        await this.markLessonComplete(courseId, pathId, moduleId, lessonId);
                    }
                }
            }
            
            console.log('Local progress synced to Supabase');
        } catch (error) {
            console.error('Progress sync error:', error);
        }
    }

    async markLessonComplete(courseId, pathId, moduleId, lessonId) {
        if (!this.user) return;

        try {
            const { error } = await supabase
                .from('course_progress')
                .upsert({
                    user_id: this.user.id,
                    course_id: courseId,
                    path_id: pathId,
                    module_id: moduleId,
                    lesson_id: lessonId,
                    completed_at: new Date().toISOString()
                });

            if (!error) {
                // Track achievement
                await this.trackAchievement('lesson_completed', { 
                    courseId, pathId, moduleId, lessonId 
                });
            }
        } catch (error) {
            console.error('Lesson completion error:', error);
        }
    }

    async trackAchievement(type, data) {
        if (!this.user) return;
        
        try {
            await supabase.from('achievements').insert({
                user_id: this.user.id,
                achievement_type: type,
                achievement_data: data
            });
        } catch (error) {
            console.error('Achievement tracking error:', error);
        }
    }

    async getUserProgress() {
        if (!this.user) return [];

        try {
            const { data, error } = await supabase
                .from('course_progress')
                .select('*')
                .eq('user_id', this.user.id);

            return error ? [] : data;
        } catch (error) {
            console.error('Progress retrieval error:', error);
            return [];
        }
    }

    async getProgressStats() {
        if (!this.user) return this.getLocalProgressStats();

        try {
            const progress = await this.getUserProgress();
            const achievements = await this.getUserAchievements();
            
            const modulesCompleted = new Set(
                progress.map(p => `${p.course_id}.${p.path_id}.${p.module_id}`)
            ).size;
            
            const coursesStarted = new Set(
                progress.map(p => p.course_id)
            ).size;

            return {
                lessonsCompleted: progress.length,
                modulesCompleted,
                coursesStarted,
                streak: this.calculateStreak(achievements)
            };
        } catch (error) {
            console.error('Stats calculation error:', error);
            return this.getLocalProgressStats();
        }
    }

    async getUserAchievements() {
        if (!this.user) return [];

        try {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', this.user.id)
                .order('earned_at', { ascending: false });

            return error ? [] : data;
        } catch (error) {
            console.error('Achievements retrieval error:', error);
            return [];
        }
    }

    getLocalProgressStats() {
        const localProgress = ProgressTracker.getAllProgress();
        const completedCount = Object.values(localProgress).filter(Boolean).length;
        
        return {
            lessonsCompleted: completedCount,
            modulesCompleted: Math.ceil(completedCount / 3), // Rough estimate
            coursesStarted: completedCount > 0 ? 1 : 0,
            streak: 1
        };
    }

    calculateStreak(achievements) {
        // Simple streak calculation based on recent lesson completions
        const lessonCompletions = achievements.filter(a => a.achievement_type === 'lesson_completed');
        if (lessonCompletions.length === 0) return 0;
        
        const today = new Date();
        let streak = 0;
        let currentDate = new Date(today);
        
        for (let i = 0; i < 7; i++) { // Check last 7 days
            const dayStart = new Date(currentDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(currentDate);
            dayEnd.setHours(23, 59, 59, 999);
            
            const hasActivity = lessonCompletions.some(completion => {
                const completionDate = new Date(completion.earned_at);
                return completionDate >= dayStart && completionDate <= dayEnd;
            });
            
            if (hasActivity) {
                streak++;
            } else if (i > 0) { // Allow for today to not have activity yet
                break;
            }
            
            currentDate.setDate(currentDate.getDate() - 1);
        }
        
        return streak;
    }

    isAuthenticated() {
        return !!this.user;
    }

    updateUI() {
        if (!this.isInitialized) return;
        
        this.renderAuthUI();
        this.updateProgressDisplay();
    }

    renderAuthUI() {
        const authContainer = document.getElementById('auth-container');
        if (!authContainer) return;

        if (this.isAuthenticated()) {
            const avatarUrl = this.profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.profile?.username || this.user.email)}&background=2563eb&color=fff`;
            
            authContainer.innerHTML = `
                <div class="user-menu" onclick="showProfileModal()">
                    <img src="${avatarUrl}" alt="Avatar" class="user-avatar">
                    <span class="username">${this.profile?.username || this.user.email.split('@')[0]}</span>
                    <button onclick="authManager.signOut(); event.stopPropagation();" class="sign-out-btn">Sign Out</button>
                </div>
            `;
        } else {
            authContainer.innerHTML = `
                <div class="auth-buttons">
                    <button onclick="showAuthModal('signin')" class="auth-btn signin-btn">Sign In</button>
                    <button onclick="showAuthModal('signup')" class="auth-btn signup-btn">Sign Up</button>
                </div>
            `;
        }
    }

    async updateProgressDisplay() {
        // Update any progress displays on the current page
        const stats = await this.getProgressStats();
        
        // Update profile modal stats if open
        const lessonsElement = document.getElementById('lessons-completed');
        const modulesElement = document.getElementById('modules-completed');
        const streakElement = document.getElementById('learning-streak');
        
        if (lessonsElement) lessonsElement.textContent = stats.lessonsCompleted;
        if (modulesElement) modulesElement.textContent = stats.modulesCompleted;
        if (streakElement) streakElement.textContent = stats.streak;
    }

    showSuccessMessage(message) {
        const container = document.getElementById('success-messages');
        if (!container) return;

        const messageEl = document.createElement('div');
        messageEl.className = 'success-message';
        messageEl.textContent = message;
        container.appendChild(messageEl);

        // Animate in
        setTimeout(() => messageEl.classList.add('show'), 100);

        // Auto remove after 3 seconds
        setTimeout(() => {
            messageEl.classList.add('hide');
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    showErrorMessage(message) {
        // For now, just use alert, but you could create a similar system for errors
        alert(`Error: ${message}`);
    }
}

// ===========================
// AUTH MODAL FUNCTIONS
// ===========================

function showAuthModal(mode = 'signin') {
    authManager.authMode = mode;
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const submitBtn = document.getElementById('auth-submit-btn');
    const usernameGroup = document.getElementById('username-group');
    const switchText = document.getElementById('auth-switch-text');
    const switchBtn = document.getElementById('auth-switch-btn');
    
    if (mode === 'signup') {
        title.textContent = 'Create Account';
        submitBtn.textContent = 'Sign Up';
        usernameGroup.style.display = 'block';
        switchText.textContent = 'Already have an account?';
        switchBtn.textContent = 'Sign In';
    } else {
        title.textContent = 'Welcome Back';
        submitBtn.textContent = 'Sign In';
        usernameGroup.style.display = 'none';
        switchText.textContent = "Don't have an account?";
        switchBtn.textContent = 'Sign Up';
    }
    
    modal.classList.remove('hidden');
    document.getElementById('email').focus();
}

function hideAuthModal() {
    const modal = document.getElementById('auth-modal');
    modal.classList.add('hidden');
    
    // Reset form
    document.getElementById('auth-form').reset();
}

function toggleAuthMode() {
    const newMode = authManager.authMode === 'signin' ? 'signup' : 'signin';
    showAuthModal(newMode);
}

// Handle auth form submission
document.addEventListener('DOMContentLoaded', () => {
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('auth-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Loading...';
            submitBtn.disabled = true;
            
            const formData = new FormData(e.target);
            const email = formData.get('email');
            const password = formData.get('password');
            const username = formData.get('username');
            
            let result;
            if (authManager.authMode === 'signup') {
                result = await authManager.signUp(email, password, username);
            } else {
                result = await authManager.signIn(email, password);
            }
            
            if (result.success) {
                hideAuthModal();
            }
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    }
});

// ===========================
// PROFILE MODAL FUNCTIONS
// ===========================

async function showProfileModal() {
    const modal = document.getElementById('profile-modal');
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const joinDateEl = document.getElementById('profile-join-date');
    const avatarEl = document.getElementById('profile-avatar');
    
    if (authManager.isAuthenticated()) {
        const user = authManager.user;
        const profile = authManager.profile;
        
        nameEl.textContent = profile?.username || user.email.split('@')[0];
        emailEl.textContent = user.email;
        joinDateEl.textContent = new Date(user.created_at).toLocaleDateString();
        avatarEl.src = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.username || user.email)}&background=2563eb&color=fff`;
        
        // Update stats
        await authManager.updateProgressDisplay();
        
        // Load recent lessons
        await loadRecentLessons();
    }
    
    modal.classList.remove('hidden');
}

function hideProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.classList.add('hidden');
}

async function loadRecentLessons() {
    const container = document.getElementById('recent-lessons');
    if (!container) return;
    
    if (authManager.isAuthenticated()) {
        try {
            const progress = await authManager.getUserProgress();
            const recentLessons = progress
                .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                .slice(0, 5);
            
            if (recentLessons.length === 0) {
                container.innerHTML = '<p class="loading-text">No lessons completed yet. Start learning!</p>';
                return;
            }
            
            container.innerHTML = recentLessons.map(lesson => `
                <div class="recent-lesson-item">
                    <div class="recent-lesson-icon">📚</div>
                    <div class="recent-lesson-info">
                        <div class="recent-lesson-title">${lesson.lesson_id.replace(/-/g, ' ')}</div>
                        <div class="recent-lesson-course">${lesson.course_id}</div>
                    </div>
                    <div class="recent-lesson-date">${new Date(lesson.completed_at).toLocaleDateString()}</div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading recent lessons:', error);
            container.innerHTML = '<p class="loading-text">Unable to load recent lessons</p>';
        }
    } else {
        container.innerHTML = '<p class="loading-text">Sign in to see your progress</p>';
    }
}

// ===========================
// ENHANCED PROGRESS TRACKER
// ===========================

// Enhanced ProgressTracker with Supabase integration
// Original ProgressTracker object will be enhanced

// Progress Tracking System
const ProgressTracker = {
    // Storage keys
    STORAGE_KEY: 'learning_nugget_progress',
    
    // Progress states
    STATES: {
        NOT_STARTED: 'not_started',
        VIEWED: 'viewed',
        IN_PROGRESS: 'in_progress', 
        COMPLETED: 'completed'
    },

    // Initialize progress tracking
    init() {
        this.loadProgress();
        console.log('Progress tracking initialized');
    },

    // Load progress from localStorage
    loadProgress() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            this.progressData = stored ? JSON.parse(stored) : {};
        } catch (error) {
            console.warn('Failed to load progress data:', error);
            this.progressData = {};
        }
    },

    // Save progress to localStorage
    saveProgress() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.progressData));
        } catch (error) {
            console.warn('Failed to save progress data:', error);
        }
    },

    // Generate unique lesson key
    getLessonKey(courseId, pathId, moduleId, lessonId) {
        return `${courseId}.${pathId}.${moduleId}.${lessonId}`;
    },

    // Get module key
    getModuleKey(courseId, pathId, moduleId) {
        return `${courseId}.${pathId}.${moduleId}`;
    },

    // Streak tracking functionality
    getTodayKey() {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    },

    getWeekKeys() {
        const today = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            days.push(date.toISOString().split('T')[0]);
        }
        return days;
    },

    addDailyActivity() {
        const today = this.getTodayKey();
        if (!this.progressData.dailyActivity) {
            this.progressData.dailyActivity = {};
        }
        if (!this.progressData.dailyActivity[today]) {
            this.progressData.dailyActivity[today] = 0;
        }
        this.progressData.dailyActivity[today]++;
        this.saveProgress();
    },

    getCurrentStreak() {
        if (!this.progressData.dailyActivity) return 0;
        
        let streak = 0;
        let currentDate = new Date();
        
        while (true) {
            const dateKey = currentDate.toISOString().split('T')[0];
            if (this.progressData.dailyActivity[dateKey] && this.progressData.dailyActivity[dateKey] > 0) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    },

    getTodayProgress() {
        const today = this.getTodayKey();
        return this.progressData.dailyActivity?.[today] || 0;
    },

    getWeeklyActivity() {
        const weekKeys = this.getWeekKeys();
        return weekKeys.map(key => ({
            date: key,
            activity: this.progressData.dailyActivity?.[key] || 0,
            dayName: new Date(key).toLocaleDateString('en', { weekday: 'short' })
        }));
    },

    // Get recommendations for home dashboard
    getRecommendations(courses) {
        const suggestions = [];
        
        // Find in-progress lessons to continue
        for (const course of courses) {
            for (const path of course.learningPaths) {
                for (const module of path.modules) {
                    for (const lesson of module.lessons) {
                        const key = this.getLessonKey(course.id, path.id, module.id, lesson.id);
                        const progress = this.progressData[key];
                        
                        if (progress && progress.state === this.STATES.VIEWED) {
                            suggestions.push({
                                type: 'continue',
                                course: course,
                                path: path,
                                module: module,
                                lesson: lesson,
                                priority: 1
                            });
                        }
                    }
                }
            }
        }
        
        // Find next lessons in started modules
        for (const course of courses) {
            for (const path of course.learningPaths) {
                for (const module of path.modules) {
                    const moduleProgress = this.getModuleProgress(course.id, path.id, module.id, module.lessons);
                    if (moduleProgress.viewed > 0 && moduleProgress.completed < moduleProgress.total) {
                        // Find first incomplete lesson
                        for (const lesson of module.lessons) {
                            const key = this.getLessonKey(course.id, path.id, module.id, lesson.id);
                            const progress = this.progressData[key];
                            
                            if (!progress || progress.state === this.STATES.NOT_STARTED) {
                                suggestions.push({
                                    type: 'next',
                                    course: course,
                                    path: path,
                                    module: module,
                                    lesson: lesson,
                                    priority: 2
                                });
                                break; // Only first incomplete lesson per module
                            }
                        }
                    }
                }
            }
        }
        
        // Find featured content (first lessons of popular paths)
        if (suggestions.length < 3) {
            for (const course of courses) {
                for (const path of course.learningPaths) {
                    if (path.modules.length > 0 && path.modules[0].lessons.length > 0) {
                        const firstLesson = path.modules[0].lessons[0];
                        const key = this.getLessonKey(course.id, path.id, path.modules[0].id, firstLesson.id);
                        const progress = this.progressData[key];
                        
                        if (!progress || progress.state === this.STATES.NOT_STARTED) {
                            suggestions.push({
                                type: 'featured',
                                course: course,
                                path: path,
                                module: path.modules[0],
                                lesson: firstLesson,
                                priority: 3
                            });
                        }
                    }
                }
            }
        }
        
        // Sort by priority and limit to top 3
        return suggestions
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 3);
    },

    // Get user level based on completed lessons
    getUserLevel() {
        let completedCount = 0;
        Object.values(this.progressData).forEach(progress => {
            if (progress.state === this.STATES.COMPLETED) {
                completedCount++;
            }
        });
        
        if (completedCount < 5) return { level: 1, name: 'Beginner', progress: completedCount, nextLevel: 5 };
        if (completedCount < 15) return { level: 2, name: 'Student', progress: completedCount - 5, nextLevel: 15 };
        if (completedCount < 30) return { level: 3, name: 'Learner', progress: completedCount - 15, nextLevel: 30 };
        if (completedCount < 50) return { level: 4, name: 'Scholar', progress: completedCount - 30, nextLevel: 50 };
        return { level: 5, name: 'Expert', progress: completedCount - 50, nextLevel: null };
    },

    // Get course key  
    getCourseKey(courseId) {
        return courseId;
    },

    // Get all progress (for Supabase sync)
    getAllProgress() {
        // Convert internal progress format to simple completed lessons map
        const progressMap = {};
        
        Object.entries(this.progressData).forEach(([key, progress]) => {
            if (progress.state === this.STATES.COMPLETED) {
                progressMap[`lesson-completed-${key}`] = true;
            }
        });

        // Also check localStorage for any lesson completion flags
        if (typeof localStorage !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('lesson-completed-') && localStorage.getItem(key) === 'true') {
                    progressMap[key] = true;
                }
            }
        }

        return progressMap;
    },

    // Mark lesson as viewed
    markLessonViewed(courseId, pathId, moduleId, lessonId) {
        const key = this.getLessonKey(courseId, pathId, moduleId, lessonId);
        const now = Date.now();
        
        if (!this.progressData[key]) {
            this.progressData[key] = {
                state: this.STATES.VIEWED,
                firstViewed: now,
                lastViewed: now,
                viewCount: 1,
                timeSpent: 0
            };
        } else {
            this.progressData[key].lastViewed = now;
            this.progressData[key].viewCount = (this.progressData[key].viewCount || 0) + 1;
            if (this.progressData[key].state === this.STATES.NOT_STARTED) {
                this.progressData[key].state = this.STATES.VIEWED;
            }
        }
        
        this.saveProgress();
        this.addDailyActivity(); // Track daily activity
        console.log(`Lesson marked as viewed: ${key}`);
    },

    // Mark lesson as completed (Enhanced with Supabase sync)
    async markLessonCompleted(courseId, pathId, moduleId, lessonId) {
        const key = this.getLessonKey(courseId, pathId, moduleId, lessonId);
        const now = Date.now();
        
        if (!this.progressData[key]) {
            this.progressData[key] = {
                state: this.STATES.COMPLETED,
                firstViewed: now,
                lastViewed: now,
                completedAt: now,
                viewCount: 1
            };
        } else {
            this.progressData[key].state = this.STATES.COMPLETED;
            this.progressData[key].completedAt = now;
            this.progressData[key].lastViewed = now;
        }
        
        this.saveProgress();
        this.addDailyActivity(); // Track daily activity
        console.log(`Lesson marked as completed: ${key}`);
        
        // Sync to Supabase if user is authenticated
        if (typeof authManager !== 'undefined' && authManager.isAuthenticated()) {
            try {
                await authManager.markLessonComplete(courseId, pathId, moduleId, lessonId);
                console.log(`Lesson synced to Supabase: ${key}`);
            } catch (error) {
                console.warn('Failed to sync lesson completion to Supabase:', error);
            }
        }
    },

    // Get lesson progress state
    getLessonProgress(courseId, pathId, moduleId, lessonId) {
        const key = this.getLessonKey(courseId, pathId, moduleId, lessonId);
        return this.progressData[key] || { state: this.STATES.NOT_STARTED };
    },

    // Get module progress statistics
    getModuleProgress(courseId, pathId, moduleId, lessons) {
        if (!lessons || lessons.length === 0) return { percentage: 0, completed: 0, total: 0, viewed: 0 };
        
        let completed = 0;
        let viewed = 0;
        
        lessons.forEach(lesson => {
            const progress = this.getLessonProgress(courseId, pathId, moduleId, lesson.id);
            if (progress.state === this.STATES.COMPLETED) {
                completed++;
                viewed++;
            } else if (progress.state === this.STATES.VIEWED || progress.state === this.STATES.IN_PROGRESS) {
                viewed++;
            }
        });
        
        return {
            percentage: Math.round((completed / lessons.length) * 100),
            completed,
            viewed,
            total: lessons.length
        };
    },

    // Get course progress statistics
    getCourseProgress(courseId, learningPaths) {
        if (!learningPaths || learningPaths.length === 0) return { percentage: 0, completed: 0, total: 0 };
        
        let totalLessons = 0;
        let completedLessons = 0;
        let viewedLessons = 0;
        
        learningPaths.forEach(path => {
            if (path.modules) {
                path.modules.forEach(module => {
                    if (module.lessons) {
                        totalLessons += module.lessons.length;
                        module.lessons.forEach(lesson => {
                            const progress = this.getLessonProgress(courseId, path.id, module.id, lesson.id);
                            if (progress.state === this.STATES.COMPLETED) {
                                completedLessons++;
                                viewedLessons++;
                            } else if (progress.state === this.STATES.VIEWED || progress.state === this.STATES.IN_PROGRESS) {
                                viewedLessons++;
                            }
                        });
                    }
                });
            }
        });
        
        return {
            percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
            completed: completedLessons,
            viewed: viewedLessons,
            total: totalLessons
        };
    },

    // Get last accessed lesson for continue functionality
    getLastAccessedLesson(courseId) {
        let lastAccessed = null;
        let latestTime = 0;
        
        Object.keys(this.progressData).forEach(key => {
            if (key.startsWith(courseId + '.')) {
                const progress = this.progressData[key];
                if (progress.lastViewed && progress.lastViewed > latestTime && progress.state !== this.STATES.COMPLETED) {
                    latestTime = progress.lastViewed;
                    const parts = key.split('.');
                    if (parts.length === 4) {
                        lastAccessed = {
                            courseId: parts[0],
                            pathId: parts[1], 
                            moduleId: parts[2],
                            lessonId: parts[3],
                            lastViewed: progress.lastViewed,
                            state: progress.state
                        };
                    }
                }
            }
        });
        
        return lastAccessed;
    },

    // Get suggested next lesson 
    getSuggestedNextLesson(courseId, learningPaths) {
        // First try to find the last accessed incomplete lesson
        const lastAccessed = this.getLastAccessedLesson(courseId);
        if (lastAccessed) {
            return lastAccessed;
        }
        
        // Otherwise find first unstarted lesson
        for (const path of learningPaths) {
            if (path.modules) {
                for (const module of path.modules) {
                    if (module.lessons) {
                        for (const lesson of module.lessons) {
                            const progress = this.getLessonProgress(courseId, path.id, module.id, lesson.id);
                            if (progress.state === this.STATES.NOT_STARTED) {
                                return {
                                    courseId,
                                    pathId: path.id,
                                    moduleId: module.id, 
                                    lessonId: lesson.id,
                                    state: progress.state,
                                    isFirstLesson: true
                                };
                            }
                        }
                    }
                }
            }
        }
        
        return null;
    },

    // Reset progress for a course (for testing/admin)
    resetCourseProgress(courseId) {
        Object.keys(this.progressData).forEach(key => {
            if (key.startsWith(courseId + '.')) {
                delete this.progressData[key];
            }
        });
        this.saveProgress();
        console.log(`Progress reset for course: ${courseId}`);
    }
};

function validateAndSanitizeContent(data) {
    if (!data || !Array.isArray(data.courses)) {
        console.error("CRITICAL: content.json is missing 'courses' array or is malformed.");
        throw new Error("content.json structure is critically malformed.");
    }

    data.courses = data.courses.filter(course => {
        if (!course || typeof course.id !== 'string' || typeof course.title !== 'string' || !Array.isArray(course.learningPaths)) {
            console.warn("Skipping malformed course (missing id, title, or learningPaths array):", course);
            return false;
        }

        course.learningPaths = course.learningPaths.filter(path => {
        if (!path || typeof path.id !== 'string' || typeof path.title !== 'string' || !Array.isArray(path.modules)) {
                console.warn(`Skipping malformed learning path (missing id, title, or modules array) in course '${course.id}':`, path);
            return false;
        }

        path.modules = path.modules.filter(module => {
            if (!module || typeof module.id !== 'string' || typeof module.title !== 'string' || !Array.isArray(module.lessons)) {
                    console.warn(`Skipping malformed module (missing id, title, or lessons array) in path '${path.id}', course '${course.id}':`, module);
                return false;
            }

            module.lessons = module.lessons.filter(lesson => {
                if (!lesson || typeof lesson.id !== 'string' || typeof lesson.title !== 'string' || typeof lesson.file !== 'string') {
                        console.warn(`Skipping malformed lesson (missing id, title, or file) in module '${module.id}', path '${path.id}', course '${course.id}':`, lesson);
                    return false;
                }
                return true;
            });
            return true; // Keep module if it's valid (even if some lessons were filtered)
        });
        return true; // Keep path if it's valid (even if some modules were filtered)
        });
        return true; // Keep course if it's valid (even if some paths were filtered)
    });
    return data;
}

let courseData = null; // To store the loaded and validated course content
let currentRoute = {
    courseId: null,
    pathId: null,
    moduleId: null,
    lessonId: null,
    data: null // Will store current view's data
};

function parseHash() {
    const hash = window.location.hash.substring(1); // Remove #
    const parts = hash.split('/').filter(p => p); // Split and remove empty parts

    // Handle search routes first
    if (parts[0] === 'search' && parts.length === 1) {
        // Extract query from URL parameters
        const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
        const query = urlParams.get('q');
        if (query && SearchEngine.isIndexed) {
            const results = SearchEngine.search(query, 50);
            renderSearchResults(query, results);
            return;
        }
    }

    // New structure:
    // #/ -> Main page (All Courses)
    // #/course-id -> Learning Paths within a course
    // #/course-id/path-id/module-id -> Module Lesson Progression View
    // #/course-id/path-id/module-id/lesson-id -> Lesson Content View
    // #/search?q=query -> Search Results

    if (parts.length === 4) { // Full lesson path
        currentRoute.courseId = parts[0];
        currentRoute.pathId = parts[1];
        currentRoute.moduleId = parts[2];
        currentRoute.lessonId = parts[3];
    } else if (parts.length === 3) { // Module lessons view
        currentRoute.courseId = parts[0];
        currentRoute.pathId = parts[1];
        currentRoute.moduleId = parts[2];
        currentRoute.lessonId = null;
    } else if (parts.length === 2) { 
        // Course and path - ambiguous, redirect to course view
        console.warn(`Direct navigation to course/path '${parts[0]}/${parts[1]}' is ambiguous. Showing course learning paths.`);
        currentRoute.courseId = parts[0];
        currentRoute.pathId = null; 
        currentRoute.moduleId = null;
        currentRoute.lessonId = null;
        window.location.hash = `#/${parts[0]}`; // Force redirect to course for clarity
    } else if (parts.length === 1) { // Course learning paths view OR courses list
        if (parts[0] === 'courses') {
            // Special route for showing all courses
            currentRoute.courseId = 'courses';
            currentRoute.pathId = null;
            currentRoute.moduleId = null;
            currentRoute.lessonId = null;
        } else {
            // Regular course learning paths view
            currentRoute.courseId = parts[0];
            currentRoute.pathId = null;
            currentRoute.moduleId = null;
            currentRoute.lessonId = null;
        }
    } else { // Home page (dashboard)
        currentRoute.courseId = null;
        currentRoute.pathId = null;
        currentRoute.moduleId = null;
        currentRoute.lessonId = null;
    }

    console.log('Route changed:', currentRoute);
    renderCurrentView();
}

function renderCoursesView(courses) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering courses.");
        return;
    }

    mainElement.innerHTML = ''; // Clear previous content

    const pageTitle = document.createElement('h2');
    pageTitle.textContent = 'Available Courses';
    pageTitle.className = 'view-title';
    mainElement.appendChild(pageTitle);

    if (!courses || courses.length === 0) {
        const noCoursesMessage = document.createElement('p');
        noCoursesMessage.textContent = 'No courses available.';
        mainElement.appendChild(noCoursesMessage);
        return;
    }

    const courseGrid = document.createElement('div');
    courseGrid.className = 'course-grid';

    courses.forEach(course => {
                const card = document.createElement('div');
        card.className = 'course-card';
                card.tabIndex = 0;
                card.setAttribute('role', 'link');
        card.setAttribute('aria-label', `View ${course.title} course`);
        card.dataset.courseId = course.id;

                card.addEventListener('click', () => {
            navigateToCourse(course.id);
                });
                card.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                navigateToCourse(course.id);
                    }
                });

        if (course.icon) {
                    const iconImg = document.createElement('img');
            iconImg.src = course.icon;
                    iconImg.alt = ""; // Decorative, as title is present
            iconImg.className = 'course-card-icon';
                    card.appendChild(iconImg);
                }

        const courseTitleElement = document.createElement('h3');
        courseTitleElement.textContent = course.title;
        courseTitleElement.className = 'course-card-title';
        card.appendChild(courseTitleElement);

        if (course.description) {
            const courseDescription = document.createElement('p');
            courseDescription.textContent = course.description;
            courseDescription.className = 'course-card-description';
            card.appendChild(courseDescription);
        }

        // Show progress and learning paths count
        const pathCount = course.learningPaths ? course.learningPaths.length : 0;
        const courseProgress = ProgressTracker.getCourseProgress(course.id, course.learningPaths);
        
        const statsContainer = document.createElement('div');
        statsContainer.className = 'course-card-stats-container';
        
        // Progress bar
        if (courseProgress.total > 0) {
            const progressContainer = document.createElement('div');
            progressContainer.className = 'progress-container';
            
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            
            const progressFill = document.createElement('div');
            progressFill.className = 'progress-fill';
            progressFill.style.width = `${courseProgress.percentage}%`;
            
            progressBar.appendChild(progressFill);
            progressContainer.appendChild(progressBar);
            
            const progressText = document.createElement('div');
            progressText.className = 'progress-text';
            progressText.textContent = `${courseProgress.percentage}% Complete (${courseProgress.completed}/${courseProgress.total} lessons)`;
            
            progressContainer.appendChild(progressText);
            statsContainer.appendChild(progressContainer);
        }
        
        // Path count
        const pathCountElement = document.createElement('div');
        pathCountElement.textContent = `${pathCount} Learning Path${pathCount === 1 ? '' : 's'}`;
        pathCountElement.className = 'course-card-stats';
        statsContainer.appendChild(pathCountElement);
        
        card.appendChild(statsContainer);

        courseGrid.appendChild(card);
    });

    mainElement.appendChild(courseGrid);

    // Focus management: focus the first focusable element
    const firstFocusable = courseGrid.querySelector('.course-card');
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

function renderHomeDashboard(courses) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering home dashboard.");
        return;
    }

    mainElement.innerHTML = ''; // Clear previous content
    mainElement.className = 'home-dashboard';

    // Get user data
    const streak = ProgressTracker.getCurrentStreak();
    const todayProgress = ProgressTracker.getTodayProgress();
    const weeklyActivity = ProgressTracker.getWeeklyActivity();
    const userLevel = ProgressTracker.getUserLevel();
    const recommendations = ProgressTracker.getRecommendations(courses);

    // Hero Section
    const heroSection = document.createElement('div');
    heroSection.className = 'hero-section';

    const welcomeTitle = document.createElement('h1');
    welcomeTitle.className = 'hero-title';
    welcomeTitle.textContent = 'Welcome back';
    heroSection.appendChild(welcomeTitle);

    const heroSubtitle = document.createElement('p');
    heroSubtitle.className = 'hero-subtitle';
    heroSubtitle.textContent = 'Build your knowledge step by step';
    heroSection.appendChild(heroSubtitle);

    mainElement.appendChild(heroSection);

    // Dashboard Grid
    const dashboardGrid = document.createElement('div');
    dashboardGrid.className = 'dashboard-grid';

    // Streak Card
    const streakCard = document.createElement('div');
    streakCard.className = 'dashboard-card streak-card';
    
    const streakHeader = document.createElement('div');
    streakHeader.className = 'streak-header';
    
    const streakNumber = document.createElement('div');
    streakNumber.className = 'streak-number';
    streakNumber.textContent = streak;
    
    const streakIcon = document.createElement('div');
    streakIcon.className = 'streak-icon';
    streakIcon.textContent = '🔥';
    
    streakHeader.appendChild(streakNumber);
    streakHeader.appendChild(streakIcon);
    
    const streakText = document.createElement('div');
    streakText.className = 'streak-text';
    const goal = 3 - todayProgress;
    if (goal > 0) {
        streakText.innerHTML = `Solve <strong>${goal} problems</strong> to ${streak === 0 ? 'start' : 'continue'} a streak`;
    } else {
        streakText.innerHTML = `<strong>Great job!</strong> You've hit your daily goal`;
    }
    
    // Weekly activity
    const weeklyGrid = document.createElement('div');
    weeklyGrid.className = 'weekly-activity';
    
    weeklyActivity.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = `activity-day ${day.activity >= 3 ? 'active' : ''}`;
        dayElement.textContent = day.dayName.charAt(0);
        dayElement.title = `${day.dayName}: ${day.activity} activities`;
        weeklyGrid.appendChild(dayElement);
    });
    
    streakCard.appendChild(streakHeader);
    streakCard.appendChild(streakText);
    streakCard.appendChild(weeklyGrid);

    // Level Card
    const levelCard = document.createElement('div');
    levelCard.className = 'dashboard-card level-card';
    
    const levelHeader = document.createElement('div');
    levelHeader.className = 'level-header';
    
    const levelBadge = document.createElement('div');
    levelBadge.className = 'level-badge';
    levelBadge.textContent = userLevel.level;
    
    const levelInfo = document.createElement('div');
    levelInfo.className = 'level-info';
    
    const levelTitle = document.createElement('div');
    levelTitle.className = 'level-title';
    levelTitle.textContent = userLevel.name;
    
    const levelProgress = document.createElement('div');
    levelProgress.className = 'level-progress-text';
    if (userLevel.nextLevel) {
        levelProgress.textContent = `${userLevel.progress}/${userLevel.nextLevel - (userLevel.level === 1 ? 0 : userLevel.level === 2 ? 5 : userLevel.level === 3 ? 15 : 30)} to next level`;
    } else {
        levelProgress.textContent = 'Max level reached!';
    }
    
    levelInfo.appendChild(levelTitle);
    levelInfo.appendChild(levelProgress);
    levelHeader.appendChild(levelBadge);
    levelHeader.appendChild(levelInfo);
    
    // Level progress bar
    if (userLevel.nextLevel) {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'level-progress-bar';
        
        const progressFill = document.createElement('div');
        progressFill.className = 'level-progress-fill';
        const maxProgress = userLevel.level === 1 ? 5 : userLevel.level === 2 ? 10 : userLevel.level === 3 ? 15 : 20;
        progressFill.style.width = `${(userLevel.progress / maxProgress) * 100}%`;
        
        progressContainer.appendChild(progressFill);
        levelCard.appendChild(levelHeader);
        levelCard.appendChild(progressContainer);
    } else {
        levelCard.appendChild(levelHeader);
    }

    dashboardGrid.appendChild(streakCard);
    dashboardGrid.appendChild(levelCard);

    // Featured Content Section - Course Carousel
    const featuredSection = document.createElement('div');
    featuredSection.className = 'featured-section';
    
    // Get current course recommendation (default to first course if no recommendations)
    let currentCourseIndex = 0;
    let currentCourseRec = null;
    
    if (recommendations.length > 0) {
        currentCourseRec = recommendations[0];
    } else {
        // Create a default recommendation for the first course
        const firstCourse = courses[0];
        if (firstCourse && firstCourse.learningPaths.length > 0 && firstCourse.learningPaths[0].modules.length > 0) {
            currentCourseRec = {
                type: 'featured',
                course: firstCourse,
                path: firstCourse.learningPaths[0],
                module: firstCourse.learningPaths[0].modules[0],
                lesson: firstCourse.learningPaths[0].modules[0].lessons[0]
            };
        }
    }
    
    if (currentCourseRec) {
        // Main featured card (vertical layout)
        const featuredCard = document.createElement('div');
        featuredCard.className = 'featured-card main-featured';
        featuredCard.id = 'main-featured-card';
        
        // Course name at top
        const courseName = document.createElement('div');
        courseName.className = 'featured-course-name';
        courseName.textContent = currentCourseRec.course.title;
        featuredCard.appendChild(courseName);
        
        // Course icon
        if (currentCourseRec.course.icon) {
            const icon = document.createElement('img');
            icon.src = currentCourseRec.course.icon;
            icon.className = 'featured-icon';
            icon.alt = '';
            featuredCard.appendChild(icon);
        }
        
        // Lesson title
        const lessonTitle = document.createElement('h3');
        lessonTitle.className = 'featured-lesson-title';
        lessonTitle.textContent = currentCourseRec.lesson.title;
        featuredCard.appendChild(lessonTitle);
        
        // Description
        const description = document.createElement('p');
        description.className = 'featured-description';
        description.textContent = currentCourseRec.lesson.description || `Continue learning in ${currentCourseRec.module.title}`;
        featuredCard.appendChild(description);
        
        // Duration
        const duration = document.createElement('div');
        duration.className = 'featured-duration';
        duration.textContent = '6 min';
        featuredCard.appendChild(duration);
        
        // Continue button
        const continueButton = document.createElement('button');
        continueButton.className = 'featured-continue-btn';
        continueButton.textContent = currentCourseRec.type === 'continue' ? 'Continue' : 'Start';
        continueButton.addEventListener('click', () => {
            navigateToLesson(currentCourseRec.course.id, currentCourseRec.path.id, currentCourseRec.module.id, currentCourseRec.lesson.id);
        });
        featuredCard.appendChild(continueButton);
        
        featuredSection.appendChild(featuredCard);
        
        // Course carousel navigation
        const courseCarousel = document.createElement('div');
        courseCarousel.className = 'course-carousel';
        
        courses.forEach((course, index) => {
            const courseCard = document.createElement('div');
            courseCard.className = `carousel-course-card ${index === 0 ? 'active' : ''}`;
            courseCard.dataset.courseIndex = index;
            
            if (course.icon) {
                const icon = document.createElement('img');
                icon.src = course.icon;
                icon.className = 'carousel-course-icon';
                icon.alt = '';
                courseCard.appendChild(icon);
            }
            
            const title = document.createElement('div');
            title.className = 'carousel-course-title';
            title.textContent = course.title;
            courseCard.appendChild(title);
            
            // Click handler to switch featured card
            courseCard.addEventListener('click', () => {
                updateFeaturedCard(course, courses, index);
                updateCarouselActive(index);
            });
            
            courseCarousel.appendChild(courseCard);
        });
        
        featuredSection.appendChild(courseCarousel);
        dashboardGrid.appendChild(featuredSection);
    }

    // Quick Access to Courses
    const quickAccessSection = document.createElement('div');
    quickAccessSection.className = 'quick-access-section';
    
    const quickAccessTitle = document.createElement('h2');
    quickAccessTitle.className = 'section-title';
    quickAccessTitle.textContent = 'Explore Courses';
    
    const coursesGrid = document.createElement('div');
    coursesGrid.className = 'quick-courses-grid';
    
    courses.forEach(course => {
        const courseCard = document.createElement('div');
        courseCard.className = 'quick-course-card';
        courseCard.addEventListener('click', () => navigateToCourse(course.id));
        
        if (course.icon) {
            const icon = document.createElement('img');
            icon.src = course.icon;
            icon.className = 'quick-course-icon';
            icon.alt = '';
            courseCard.appendChild(icon);
        }
        
        const title = document.createElement('h4');
        title.className = 'quick-course-title';
        title.textContent = course.title;
        
        const progress = ProgressTracker.getCourseProgress(course.id, course.learningPaths);
        const progressText = document.createElement('div');
        progressText.className = 'quick-course-progress';
        progressText.textContent = progress.total > 0 ? `${progress.percentage}% complete` : 'Start learning';
        
        courseCard.appendChild(title);
        courseCard.appendChild(progressText);
        coursesGrid.appendChild(courseCard);
    });
    
    quickAccessSection.appendChild(quickAccessTitle);
    quickAccessSection.appendChild(coursesGrid);

    mainElement.appendChild(dashboardGrid);
    mainElement.appendChild(quickAccessSection);
}

// Global helper functions for home dashboard carousel
function updateFeaturedCard(course, allCourses, courseIndex) {
    const featuredCard = document.getElementById('main-featured-card');
    if (!featuredCard) return;
    
    // Get current recommendations for this function scope
    const recommendations = ProgressTracker.getRecommendations(allCourses);
    
    // Find best recommendation for this course
    let courseRec = recommendations.find(rec => rec.course.id === course.id);
    
    if (!courseRec && course.learningPaths.length > 0 && course.learningPaths[0].modules.length > 0) {
        // Create default recommendation
        courseRec = {
            type: 'featured',
            course: course,
            path: course.learningPaths[0],
            module: course.learningPaths[0].modules[0],
            lesson: course.learningPaths[0].modules[0].lessons[0]
        };
    }
    
    if (courseRec) {
        // Update card content with smooth transition
        featuredCard.style.opacity = '0.7';
        
        setTimeout(() => {
            // Update course name
            const courseName = featuredCard.querySelector('.featured-course-name');
            if (courseName) courseName.textContent = courseRec.course.title;
            
            // Update icon
            const icon = featuredCard.querySelector('.featured-icon');
            if (icon && courseRec.course.icon) icon.src = courseRec.course.icon;
            
            // Update lesson title
            const lessonTitle = featuredCard.querySelector('.featured-lesson-title');
            if (lessonTitle) lessonTitle.textContent = courseRec.lesson.title;
            
            // Update description
            const description = featuredCard.querySelector('.featured-description');
            if (description) description.textContent = courseRec.lesson.description || `Continue learning in ${courseRec.module.title}`;
            
            // Update button text and handler
            const button = featuredCard.querySelector('.featured-continue-btn');
            if (button) {
                button.textContent = courseRec.type === 'continue' ? 'Continue' : 'Start';
                button.onclick = () => {
                    navigateToLesson(courseRec.course.id, courseRec.path.id, courseRec.module.id, courseRec.lesson.id);
                };
            }
            
            featuredCard.style.opacity = '1';
        }, 150);
    }
}

// Function to update active state in carousel
function updateCarouselActive(activeIndex) {
    const carouselCards = document.querySelectorAll('.carousel-course-card');
    carouselCards.forEach((card, index) => {
        card.classList.toggle('active', index === activeIndex);
    });
}

function renderLearningPathsView(course) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering learning paths.");
        return;
    }

    mainElement.innerHTML = ''; // Clear previous content
    mainElement.className = 'course-paths-view';

    // Hero section with course info
    const heroSection = document.createElement('div');
    heroSection.className = 'course-hero-section';

    // Breadcrumb navigation
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'course-breadcrumb';
    breadcrumb.setAttribute('aria-label', 'Breadcrumb');
    breadcrumb.innerHTML = `
        <a href="#/" class="breadcrumb-link">🏠 Home</a>
        <span class="breadcrumb-separator">></span>
        <span class="breadcrumb-current">${course.title}</span>
    `;
    heroSection.appendChild(breadcrumb);

    // Course header
    const courseHeader = document.createElement('div');
    courseHeader.className = 'course-header';

    if (course.icon) {
        const courseIcon = document.createElement('img');
        courseIcon.src = course.icon;
        courseIcon.className = 'course-header-icon';
        courseIcon.alt = '';
        courseHeader.appendChild(courseIcon);
    }

    const courseInfo = document.createElement('div');
    courseInfo.className = 'course-header-info';

    const courseTitle = document.createElement('h1');
    courseTitle.className = 'course-header-title';
    courseTitle.textContent = course.title;
    courseInfo.appendChild(courseTitle);

    const courseDescription = document.createElement('p');
    courseDescription.className = 'course-header-description';
    courseDescription.textContent = course.description || 'Master the concepts through interactive lessons and exercises.';
    courseInfo.appendChild(courseDescription);

    // Course statistics
    const courseStats = document.createElement('div');
    courseStats.className = 'course-header-stats';
    
    const totalLessons = course.learningPaths.reduce((total, path) => 
        total + path.modules.reduce((pathTotal, module) => 
            pathTotal + (module.lessons ? module.lessons.length : 0), 0), 0);
    
    const courseProgress = ProgressTracker.getCourseProgress(course.id, course.learningPaths);
    
    courseStats.innerHTML = `
        <div class="course-stat-item">
            <span class="stat-number">${course.learningPaths.length}</span>
            <span class="stat-label">Learning Paths</span>
        </div>
        <div class="course-stat-item">
            <span class="stat-number">${totalLessons}</span>
            <span class="stat-label">Lessons</span>
        </div>
        <div class="course-stat-item">
            <span class="stat-number">${courseProgress.percentage}%</span>
            <span class="stat-label">Complete</span>
        </div>
    `;
    courseInfo.appendChild(courseStats);

    courseHeader.appendChild(courseInfo);
    heroSection.appendChild(courseHeader);
    mainElement.appendChild(heroSection);

    if (!course.learningPaths || course.learningPaths.length === 0) {
        const noPathsMessage = document.createElement('div');
        noPathsMessage.className = 'no-content-message';
        noPathsMessage.innerHTML = `
            <div class="no-content-icon">📚</div>
            <h3>No Learning Paths Available</h3>
            <p>This course doesn't have any learning paths configured yet.</p>
        `;
        mainElement.appendChild(noPathsMessage);
        return;
    }

    // Continue Learning Section
    const suggestedLesson = ProgressTracker.getSuggestedNextLesson(course.id, course.learningPaths);
    if (suggestedLesson) {
        const continueSection = document.createElement('div');
        continueSection.className = 'continue-learning-section';
        
        const continueTitle = document.createElement('h2');
        continueTitle.className = 'continue-section-title';
        continueTitle.textContent = suggestedLesson.isFirstLesson ? '🚀 Start Your Journey' : '📚 Continue Learning';
        continueSection.appendChild(continueTitle);
        
        const continueCard = document.createElement('div');
        continueCard.className = 'modern-continue-card';
        
        // Find the lesson details for display
        const suggestedPath = course.learningPaths.find(p => p.id === suggestedLesson.pathId);
        const suggestedModule = suggestedPath?.modules.find(m => m.id === suggestedLesson.moduleId);
        const suggestedLessonObj = suggestedModule?.lessons.find(l => l.id === suggestedLesson.lessonId);
        
        if (suggestedLessonObj) {
            continueCard.innerHTML = `
                <div class="continue-card-content">
                    <div class="continue-lesson-badge">${suggestedPath.title}</div>
                    <h3 class="continue-lesson-title">${suggestedLessonObj.title}</h3>
                    <p class="continue-lesson-path">${suggestedModule.title}</p>
                    <div class="continue-lesson-meta">Ready to continue • 6 min</div>
                </div>
                <button class="continue-action-btn">
                    ${suggestedLesson.isFirstLesson ? 'Start' : 'Continue'}
                    <span class="continue-arrow">→</span>
                </button>
            `;
            
            continueCard.addEventListener('click', () => {
                navigateToLesson(course.id, suggestedLesson.pathId, suggestedLesson.moduleId, suggestedLesson.lessonId);
            });
        }
        
        continueSection.appendChild(continueCard);
        mainElement.appendChild(continueSection);
    }

    // Learning Paths Section
    const pathsSection = document.createElement('div');
    pathsSection.className = 'learning-paths-section';

    const pathsTitle = document.createElement('h2');
    pathsTitle.className = 'paths-section-title';
    pathsTitle.textContent = 'Learning Paths';
    pathsSection.appendChild(pathsTitle);

    const pathsGrid = document.createElement('div');
    pathsGrid.className = 'learning-paths-grid';

    course.learningPaths.forEach((path, pathIndex) => {
        const pathCard = document.createElement('div');
        pathCard.className = 'modern-path-card';
        
        // Path header
        const pathHeader = document.createElement('div');
        pathHeader.className = 'path-card-header';
        
        if (path.icon) {
            const pathIcon = document.createElement('img');
            pathIcon.src = path.icon;
            pathIcon.className = 'path-card-icon';
            pathIcon.alt = '';
            pathHeader.appendChild(pathIcon);
        }
        
        const pathInfo = document.createElement('div');
        pathInfo.className = 'path-card-info';
        
        const pathTitle = document.createElement('h3');
        pathTitle.className = 'path-card-title';
        pathTitle.textContent = path.title;
        pathInfo.appendChild(pathTitle);
        
        const pathDescription = document.createElement('p');
        pathDescription.className = 'path-card-description';
        pathDescription.textContent = path.description || 'Interactive lessons and exercises to master the concepts.';
        pathInfo.appendChild(pathDescription);
        
        pathHeader.appendChild(pathInfo);
        pathCard.appendChild(pathHeader);

        // Modules grid
        if (path.modules && path.modules.length > 0) {
            const modulesGrid = document.createElement('div');
            modulesGrid.className = 'path-modules-grid';
            
            path.modules.forEach((module, moduleIndex) => {
                const moduleCard = document.createElement('div');
                moduleCard.className = 'modern-module-card';
                moduleCard.tabIndex = 0;
                moduleCard.setAttribute('role', 'button');
                moduleCard.setAttribute('aria-label', `View ${module.title} module`);
                
                const moduleProgress = ProgressTracker.getModuleProgress(course.id, path.id, module.id, module.lessons);
                const lessonCount = module.lessons ? module.lessons.length : 0;
                
                // Module status indicator
                const statusIndicator = document.createElement('div');
                statusIndicator.className = 'module-status-indicator';
                
                if (moduleProgress.percentage === 100) {
                    statusIndicator.innerHTML = '<div class="status-icon completed">✅</div>';
                    moduleCard.classList.add('completed');
                } else if (moduleProgress.percentage > 0) {
                    statusIndicator.innerHTML = '<div class="status-icon in-progress">🎯</div>';
                    moduleCard.classList.add('in-progress');
                } else {
                    statusIndicator.innerHTML = '<div class="status-icon not-started">⚪</div>';
                    moduleCard.classList.add('not-started');
                }
                
                moduleCard.appendChild(statusIndicator);
                
                // Module content
                const moduleContent = document.createElement('div');
                moduleContent.className = 'module-card-content';
                
                const moduleTitle = document.createElement('h4');
                moduleTitle.className = 'module-card-title';
                moduleTitle.textContent = module.title;
                moduleContent.appendChild(moduleTitle);
                
                const moduleStats = document.createElement('div');
                moduleStats.className = 'module-card-stats';
                moduleStats.innerHTML = `
                    <span class="module-lesson-count">${lessonCount} lessons</span>
                    <span class="module-progress-percent">${moduleProgress.percentage}% complete</span>
                `;
                moduleContent.appendChild(moduleStats);
                
                // Progress bar
                if (moduleProgress.total > 0) {
                    const progressContainer = document.createElement('div');
                    progressContainer.className = 'module-progress-container';
                    
                    const progressBar = document.createElement('div');
                    progressBar.className = 'module-progress-bar';
                    
                    const progressFill = document.createElement('div');
                    progressFill.className = 'module-progress-fill';
                    progressFill.style.width = `${moduleProgress.percentage}%`;
                    
                    progressBar.appendChild(progressFill);
                    progressContainer.appendChild(progressBar);
                    moduleContent.appendChild(progressContainer);
                }
                
                moduleCard.appendChild(moduleContent);
                
                // Click handler
                moduleCard.addEventListener('click', () => {
                    navigateToModule(course.id, path.id, module.id);
                });
                moduleCard.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        navigateToModule(course.id, path.id, module.id);
                    }
                });
                
                modulesGrid.appendChild(moduleCard);
            });
            
            pathCard.appendChild(modulesGrid);
        } else {
            const noModules = document.createElement('div');
            noModules.className = 'no-modules-message';
            noModules.textContent = 'No modules available in this learning path.';
            pathCard.appendChild(noModules);
        }
        
        pathsGrid.appendChild(pathCard);
    });
    
    pathsSection.appendChild(pathsGrid);
    mainElement.appendChild(pathsSection);

    // Focus management: focus the first focusable element (e.g., first module card if paths exist)
    const firstFocusable = mainElement.querySelector('.module-card, .learning-path-title'); // Adjust selector as needed
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

function renderModuleLessonsView(course, path, module) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering lesson progression.");
        return;
    }
    mainElement.innerHTML = ''; // Clear previous content
    mainElement.className = 'module-lessons-view';

    // Breadcrumb navigation
    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'module-breadcrumb';
    breadcrumb.setAttribute('aria-label', 'Breadcrumb');
    breadcrumb.innerHTML = `
        <a href="#/" class="breadcrumb-link">🏠 Home</a> 
        <span class="breadcrumb-separator">></span>
        <a href="#/${course.id}" class="breadcrumb-link">${course.title}</a>
        <span class="breadcrumb-separator">></span>
        <span class="breadcrumb-current">${module.title}</span>
    `;
    mainElement.appendChild(breadcrumb);

    // Two-column layout container
    const moduleContainer = document.createElement('div');
    moduleContainer.className = 'module-brilliant-layout';

    // LEFT COLUMN - Module/Course Info
    const leftColumn = document.createElement('div');
    leftColumn.className = 'module-info-column';

    // Module info card
    const moduleCard = document.createElement('div');
    moduleCard.className = 'module-info-card';

    // Module icon
    if (course.icon) {
        const moduleIcon = document.createElement('img');
        moduleIcon.src = course.icon;
        moduleIcon.className = 'module-info-icon';
        moduleIcon.alt = '';
        moduleCard.appendChild(moduleIcon);
    }

    // Module title
    const moduleTitle = document.createElement('h1');
    moduleTitle.className = 'module-info-title';
    moduleTitle.textContent = module.title;
    moduleCard.appendChild(moduleTitle);

    // Module description
    const moduleDescription = document.createElement('p');
    moduleDescription.className = 'module-info-description';
    moduleDescription.textContent = module.description || `Learn ${module.title.toLowerCase()} concepts step by step with interactive lessons and exercises.`;
    moduleCard.appendChild(moduleDescription);

    // Module statistics
    const moduleStats = document.createElement('div');
    moduleStats.className = 'module-stats';

    const lessonsCount = module.lessons ? module.lessons.length : 0;
    const exercisesCount = module.lessons ? module.lessons.filter(l => 
        l.title.toLowerCase().includes('exercise') || 
        l.title.toLowerCase().includes('experiment') || 
        l.title.toLowerCase().includes('coding')
    ).length : 0;
    const moduleProgress = ProgressTracker.getModuleProgress(course.id, path.id, module.id, module.lessons);

    const statsHTML = `
        <div class="stat-item">
            <span class="stat-icon">📚</span>
            <span class="stat-text">${lessonsCount} Lessons</span>
        </div>
        <div class="stat-item">
            <span class="stat-icon">🎯</span>
            <span class="stat-text">${exercisesCount} Exercises</span>
        </div>
        <div class="stat-item">
            <span class="stat-icon">⭐</span>
            <span class="stat-text">${moduleProgress.percentage}% Complete</span>
        </div>
    `;
    moduleStats.innerHTML = statsHTML;
    moduleCard.appendChild(moduleStats);

    leftColumn.appendChild(moduleCard);
    moduleContainer.appendChild(leftColumn);

    // RIGHT COLUMN - Lesson Progression
    const rightColumn = document.createElement('div');
    rightColumn.className = 'lesson-progression-column';

    if (!module.lessons || module.lessons.length === 0) {
        rightColumn.innerHTML = '<p class="no-lessons">No lessons available in this module.</p>';
        moduleContainer.appendChild(rightColumn);
        mainElement.appendChild(moduleContainer);
        return;
    }

    // Determine lesson access/lock logic
    let lastCompletedIndex = -1;
    module.lessons.forEach((lesson, index) => {
        const progress = ProgressTracker.getLessonProgress(course.id, path.id, module.id, lesson.id);
        if (progress.state === ProgressTracker.STATES.COMPLETED) {
            lastCompletedIndex = index;
        }
    });

    // Level header
    const levelHeader = document.createElement('div');
    levelHeader.className = 'lesson-level-header';
    levelHeader.textContent = 'LEVEL 1';
    rightColumn.appendChild(levelHeader);

    // Lesson progression list
    const lessonsList = document.createElement('div');
    lessonsList.className = 'brilliant-lessons-list';

    let nextLessonToFeature = null;

    module.lessons.forEach((lesson, index) => {
        const progress = ProgressTracker.getLessonProgress(course.id, path.id, module.id, lesson.id);
        const isAccessible = index <= lastCompletedIndex + 1; // Current + one ahead
        const isNext = index === lastCompletedIndex + 1 && progress.state === ProgressTracker.STATES.NOT_STARTED;

        if (isNext && !nextLessonToFeature) {
            nextLessonToFeature = lesson;
        }

        // Lesson item
        const lessonItem = document.createElement('div');
        lessonItem.className = `brilliant-lesson-item ${!isAccessible ? 'locked' : ''}`;
        
        // Status indicator
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'lesson-status-indicator';
        
        if (!isAccessible) {
            statusIndicator.innerHTML = '<div class="status-icon locked">🔒</div>';
            lessonItem.classList.add('locked');
        } else {
            switch (progress.state) {
                case ProgressTracker.STATES.COMPLETED:
                    statusIndicator.innerHTML = '<div class="status-icon completed">✅</div>';
                    lessonItem.classList.add('completed');
                    break;
                case ProgressTracker.STATES.VIEWED:
                case ProgressTracker.STATES.IN_PROGRESS:
                    statusIndicator.innerHTML = '<div class="status-icon current">🎯</div>';
                    lessonItem.classList.add('current');
                    break;
                default:
                    if (isNext) {
                        statusIndicator.innerHTML = '<div class="status-icon next">➡️</div>';
                        lessonItem.classList.add('next');
                    } else {
                        statusIndicator.innerHTML = '<div class="status-icon available">⚪</div>';
                        lessonItem.classList.add('available');
                    }
            }
        }

        // Lesson content
        const lessonContent = document.createElement('div');
        lessonContent.className = 'lesson-item-content';
        
        const lessonTitle = document.createElement('div');
        lessonTitle.className = 'lesson-item-title';
        lessonTitle.textContent = lesson.title;
        
        const lessonMeta = document.createElement('div');
        lessonMeta.className = 'lesson-item-meta';
        
        // Determine lesson type from title
        const title = lesson.title.toLowerCase();
        let lessonType = 'Lesson';
        if (title.includes('exercise')) {
            lessonType = 'Exercise';
        } else if (title.includes('experiment')) {
            lessonType = 'Experiment';
        } else if (title.includes('coding')) {
            lessonType = 'Coding';
        }
        
        lessonMeta.textContent = lessonType;

        lessonContent.appendChild(lessonTitle);
        lessonContent.appendChild(lessonMeta);

        lessonItem.appendChild(statusIndicator);
        lessonItem.appendChild(lessonContent);

        // Click handler (only for accessible lessons)
        if (isAccessible) {
            lessonItem.style.cursor = 'pointer';
            lessonItem.addEventListener('click', () => {
                navigateToLesson(course.id, path.id, module.id, lesson.id);
            });
            lessonItem.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigateToLesson(course.id, path.id, module.id, lesson.id);
                }
            });
            lessonItem.tabIndex = 0;
        }

        lessonsList.appendChild(lessonItem);
    });

    rightColumn.appendChild(lessonsList);

    // Featured next lesson at bottom (like Brilliant)
    if (nextLessonToFeature) {
        const featuredLesson = document.createElement('div');
        featuredLesson.className = 'featured-next-lesson';
        
        const featuredTitle = document.createElement('div');
        featuredTitle.className = 'featured-lesson-title';
        featuredTitle.textContent = nextLessonToFeature.title;
        
        const featuredButton = document.createElement('button');
        featuredButton.className = 'featured-lesson-start-btn';
        featuredButton.textContent = 'Start';
        featuredButton.addEventListener('click', () => {
            navigateToLesson(course.id, path.id, module.id, nextLessonToFeature.id);
        });
        
        featuredLesson.appendChild(featuredTitle);
        featuredLesson.appendChild(featuredButton);
        rightColumn.appendChild(featuredLesson);
    }

    moduleContainer.appendChild(rightColumn);
    mainElement.appendChild(moduleContainer);

    // Focus management
    const firstFocusable = rightColumn.querySelector('.brilliant-lesson-item[tabindex="0"]');
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

// NEW function to render the dedicated lesson content view
function renderLessonContentView(course, path, module, lesson) {
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering lesson content.");
        return;
    }
    mainElement.innerHTML = ''; // Clear previous content
    mainElement.classList.add('lesson-view-active'); // Add class for fullscreen styling
    document.body.classList.add('lesson-body-active'); // Add class to body for fullscreen styling
    document.documentElement.classList.add('lesson-body-active'); // Add class to HTML element

    // Breadcrumb/Navigation for the lesson view
    const lessonNav = document.createElement('nav');
    lessonNav.className = 'lesson-view-nav'; // Add a class for styling
    lessonNav.setAttribute('aria-label', 'Lesson Navigation');

    const backLink = document.createElement('a');
    backLink.href = `#/${course.id}/${path.id}/${module.id}`;
    backLink.textContent = `‹ Back to ${module.title}`;
    backLink.className = 'lesson-back-link';
    lessonNav.appendChild(backLink);
    
    const lessonTitle = document.createElement('h2');
    lessonTitle.textContent = lesson.title;
    lessonTitle.className = 'lesson-view-title'; // Add a class for styling
    
    // Container for the header elements
    const lessonHeaderContainer = document.createElement('div');
    lessonHeaderContainer.className = 'lesson-header-container';
    lessonHeaderContainer.appendChild(lessonNav);
    lessonHeaderContainer.appendChild(lessonTitle);
    mainElement.appendChild(lessonHeaderContainer);
    
    // Container for the iframe
    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'lesson-viewer-frame-container'; // New ID for iframe
    iframeContainer.className = 'lesson-viewer-frame-container'; // Add a class for styling
    mainElement.appendChild(iframeContainer);



    loadLessonInIframe(course, path, module, lesson); // Call the existing function to load content
}

function renderCurrentView() {
    console.log("Attempting to render view for:", currentRoute);
    const mainElement = document.querySelector('main');
    if (!mainElement) {
        console.error("Main element not found for rendering.");
        return;
    }
    // Remove lesson-specific classes before any rendering
    mainElement.classList.remove('lesson-view-active');
    document.body.classList.remove('lesson-body-active');
    document.documentElement.classList.remove('lesson-body-active');

    if (!courseData) {
        console.log("Course data not loaded yet. Cannot render view.");
        return;
    }

    mainElement.innerHTML = '<!-- Content will be dynamically injected here -->'; 

    if (currentRoute.courseId && currentRoute.pathId && currentRoute.moduleId) { // We have a course, path, and module
        const course = courseData.courses.find(c => c.id === currentRoute.courseId);
        if (course) {
            const path = course.learningPaths.find(p => p.id === currentRoute.pathId);
        if (path) {
            const module = path.modules.find(m => m.id === currentRoute.moduleId);
            if (module) {
                if (currentRoute.lessonId) { // If we also have a lesson ID, render lesson content
                    const lesson = module.lessons.find(l => l.id === currentRoute.lessonId);
                    if (lesson) {
                            renderLessonContentView(course, path, module, lesson);
                    } else {
                        console.warn(`Lesson ID '${currentRoute.lessonId}' in hash not found. Displaying module lessons view.`);
                        displayError(`Lesson '${currentRoute.lessonId}' not found in module '${module.title}'.`);
                            renderModuleLessonsView(course, path, module); // Fallback to module lesson list
                    }
                } else { // No lessonId, so render the module's lesson list
                        renderModuleLessonsView(course, path, module);
                }
            } else {
                    displayError(`Module with ID '${currentRoute.moduleId}' not found in path '${path.title}'. Redirecting to course.`);
                    navigateToCourse(course.id);
            }
        } else {
                displayError(`Learning Path with ID '${currentRoute.pathId}' not found in course '${course.title}'. Redirecting to course.`);
                navigateToCourse(course.id);
            }
        } else {
            displayError(`Course with ID '${currentRoute.courseId}' not found. Redirecting to home.`);
            navigateToHome();
        }
    } else if (currentRoute.courseId) { // Only course selected, show learning paths within course OR courses list
        if (currentRoute.courseId === 'courses') {
            // Special case: show all courses
            renderCoursesView(courseData.courses);
        } else {
            const course = courseData.courses.find(c => c.id === currentRoute.courseId);
            if (course) {
                renderLearningPathsView(course);
            } else {
                displayError(`Course with ID '${currentRoute.courseId}' not found. Redirecting to home.`);
                navigateToHome();
            }
        }
    } else { // No specific course selected - show home dashboard
        renderHomeDashboard(courseData.courses);
    }
}

function navigateToCourse(courseId) {
    window.location.hash = `/${courseId}`;
}

function navigateToModule(courseId, pathId, moduleId) {
    window.location.hash = `/${courseId}/${pathId}/${moduleId}`;
}

function navigateToLesson(courseId, pathId, moduleId, lessonId) {
    window.location.hash = `/${courseId}/${pathId}/${moduleId}/${lessonId}`;
}

function navigateToHome() {
    window.location.hash = '#/';
}

function showAllCourses() {
    if (courseData && courseData.courses) {
        renderCoursesView(courseData.courses);
        // Update URL to reflect courses view
        window.location.hash = '#/courses';
    } else {
        console.warn('Course data not available yet');
        // Try to trigger a reload of course data
        if (typeof loadCourseData === 'function') {
            loadCourseData();
        }
    }
}

// Make navigation functions globally accessible for header buttons
window.navigateToHome = navigateToHome;
window.showAllCourses = showAllCourses;

// ===== SEARCH FUNCTIONALITY =====

const SearchEngine = {
    searchIndex: [],
    isIndexed: false,

    // Build search index from course data
    buildIndex(courses) {
        console.log('Building search index...');
        this.searchIndex = [];
        
        courses.forEach(course => {
            // Index course
            this.searchIndex.push({
                type: 'course',
                title: course.title,
                description: course.description || '',
                keywords: [course.title.toLowerCase()],
                data: {
                    courseId: course.id,
                    course: course
                },
                score: 0
            });

            course.learningPaths.forEach(path => {
                // Index learning path
                this.searchIndex.push({
                    type: 'path',
                    title: path.title,
                    description: path.description || '',
                    keywords: [path.title.toLowerCase(), course.title.toLowerCase()],
                    data: {
                        courseId: course.id,
                        pathId: path.id,
                        course: course,
                        path: path
                    },
                    score: 0
                });

                path.modules.forEach(module => {
                    // Index module
                    this.searchIndex.push({
                        type: 'module',
                        title: module.title,
                        description: `${path.title} module`,
                        keywords: [
                            module.title.toLowerCase(), 
                            path.title.toLowerCase(), 
                            course.title.toLowerCase()
                        ],
                        data: {
                            courseId: course.id,
                            pathId: path.id,
                            moduleId: module.id,
                            course: course,
                            path: path,
                            module: module
                        },
                        score: 0
                    });

                    if (module.lessons) {
                        module.lessons.forEach(lesson => {
                            // Index lesson
                            const lessonType = this.getLessonType(lesson.title);
                            this.searchIndex.push({
                                type: 'lesson',
                                title: lesson.title,
                                description: `${lessonType} in ${module.title}`,
                                keywords: [
                                    lesson.title.toLowerCase(),
                                    module.title.toLowerCase(),
                                    path.title.toLowerCase(),
                                    course.title.toLowerCase(),
                                    lessonType.toLowerCase()
                                ],
                                data: {
                                    courseId: course.id,
                                    pathId: path.id,
                                    moduleId: module.id,
                                    lessonId: lesson.id,
                                    course: course,
                                    path: path,
                                    module: module,
                                    lesson: lesson
                                },
                                score: 0
                            });
                        });
                    }
                });
            });
        });
        
        this.isIndexed = true;
        console.log(`Search index built with ${this.searchIndex.length} items`);
    },

    // Get lesson type from title
    getLessonType(title) {
        const lowerTitle = title.toLowerCase();
        if (lowerTitle.includes('exercise')) return 'Exercise';
        if (lowerTitle.includes('experiment')) return 'Experiment';
        if (lowerTitle.includes('coding')) return 'Coding';
        return 'Lesson';
    },

    // Perform search
    search(query, limit = 20) {
        if (!this.isIndexed) {
            console.warn('Search index not built yet');
            return [];
        }

        if (!query || query.length < 2) {
            return [];
        }

        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 1);
        const results = [];

        this.searchIndex.forEach(item => {
            let score = 0;
            
            // Title exact match (highest score)
            if (item.title.toLowerCase().includes(query.toLowerCase())) {
                score += 100;
                if (item.title.toLowerCase().startsWith(query.toLowerCase())) {
                    score += 50; // Bonus for starting with query
                }
            }

            // Description match
            if (item.description.toLowerCase().includes(query.toLowerCase())) {
                score += 30;
            }

            // Keywords match
            searchTerms.forEach(term => {
                item.keywords.forEach(keyword => {
                    if (keyword.includes(term)) {
                        score += 20;
                        if (keyword.startsWith(term)) {
                            score += 10; // Bonus for starting with term
                        }
                    }
                });
            });

            // Type-based scoring (lessons are more specific)
            if (score > 0) {
                switch (item.type) {
                    case 'lesson': score += 10; break;
                    case 'module': score += 5; break;
                    case 'path': score += 3; break;
                    case 'course': score += 1; break;
                }
                
                item.score = score;
                results.push(item);
            }
        });

        // Sort by score and return top results
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    },

    // Get search suggestions for autocomplete
    getSuggestions(query, limit = 5) {
        if (!query || query.length < 2) return [];
        
        const results = this.search(query, limit);
        return results.map(item => ({
            text: item.title,
            type: item.type,
            data: item.data
        }));
    }
};

// Search UI Functions
function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    if (!query) {
        searchInput.focus();
        return;
    }

    // Hide suggestions
    hideSuggestions();
    
    // Perform search and show results
    const results = SearchEngine.search(query, 50);
    renderSearchResults(query, results);
    
    // Update URL
    window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
}

function renderSearchResults(query, results) {
    const mainElement = document.querySelector('main');
    if (!mainElement) return;

    mainElement.innerHTML = '';
    mainElement.className = 'search-results-view';

    // Search header
    const searchHeader = document.createElement('div');
    searchHeader.className = 'search-header';

    const breadcrumb = document.createElement('nav');
    breadcrumb.className = 'search-breadcrumb';
    breadcrumb.innerHTML = `
        <a href="#/" class="breadcrumb-link">🏠 Home</a>
        <span class="breadcrumb-separator">></span>
        <span class="breadcrumb-current">Search Results</span>
    `;
    searchHeader.appendChild(breadcrumb);

    const searchTitle = document.createElement('h1');
    searchTitle.className = 'search-title';
    searchTitle.textContent = `Search Results for "${query}"`;
    searchHeader.appendChild(searchTitle);

    const searchMeta = document.createElement('div');
    searchMeta.className = 'search-meta';
    searchMeta.textContent = `Found ${results.length} result${results.length === 1 ? '' : 's'}`;
    searchHeader.appendChild(searchMeta);

    mainElement.appendChild(searchHeader);

    if (results.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'no-search-results';
        noResults.innerHTML = `
            <div class="no-results-icon">🔍</div>
            <h3>No Results Found</h3>
            <p>Try different keywords or browse our courses directly.</p>
            <button class="browse-courses-btn" onclick="showAllCourses()">Browse All Courses</button>
        `;
        mainElement.appendChild(noResults);
        return;
    }

    // Group results by type
    const groupedResults = {
        lesson: [],
        module: [],
        path: [],
        course: []
    };

    results.forEach(result => {
        groupedResults[result.type].push(result);
    });

    // Render result groups
    const resultsContainer = document.createElement('div');
    resultsContainer.className = 'search-results-container';

    Object.entries(groupedResults).forEach(([type, items]) => {
        if (items.length === 0) return;

        const groupSection = document.createElement('div');
        groupSection.className = 'search-result-group';

        const groupHeader = document.createElement('h2');
        groupHeader.className = 'search-group-title';
        groupHeader.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)}s (${items.length})`;
        groupSection.appendChild(groupHeader);

        const groupGrid = document.createElement('div');
        groupGrid.className = 'search-results-grid';

        items.forEach(item => {
            const resultCard = createSearchResultCard(item, query);
            groupGrid.appendChild(resultCard);
        });

        groupSection.appendChild(groupGrid);
        resultsContainer.appendChild(groupSection);
    });

    mainElement.appendChild(resultsContainer);
}

function createSearchResultCard(item, query) {
    const card = document.createElement('div');
    card.className = `search-result-card ${item.type}-result`;
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    // Result icon based on type
    const iconMap = {
        course: '🎓',
        path: '🛤️',
        module: '📚',
        lesson: item.title.toLowerCase().includes('exercise') ? '🎯' : 
               item.title.toLowerCase().includes('experiment') ? '🔬' : 
               item.title.toLowerCase().includes('coding') ? '💻' : '📖'
    };

    // Highlight query in title
    const highlightedTitle = highlightSearchTerms(item.title, query);
    const highlightedDescription = highlightSearchTerms(item.description, query);

    card.innerHTML = `
        <div class="result-icon">${iconMap[item.type]}</div>
        <div class="result-content">
            <div class="result-type-badge">${item.type}</div>
            <h3 class="result-title">${highlightedTitle}</h3>
            <p class="result-description">${highlightedDescription}</p>
            <div class="result-path">${getResultPath(item)}</div>
        </div>
        <div class="result-action">
            <span class="result-arrow">→</span>
        </div>
    `;

    // Click handler
    card.addEventListener('click', () => navigateToSearchResult(item));
    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            navigateToSearchResult(item);
        }
    });

    return card;
}

function highlightSearchTerms(text, query) {
    if (!query) return text;
    
    const searchTerms = query.split(' ').filter(term => term.length > 1);
    let highlighted = text;
    
    searchTerms.forEach(term => {
        const regex = new RegExp(`(${term})`, 'gi');
        highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });
    
    return highlighted;
}

function getResultPath(item) {
    const pathParts = [];
    
    if (item.data.course) pathParts.push(item.data.course.title);
    if (item.data.path && item.type !== 'path') pathParts.push(item.data.path.title);
    if (item.data.module && item.type !== 'module') pathParts.push(item.data.module.title);
    
    return pathParts.join(' > ');
}

function navigateToSearchResult(item) {
    const data = item.data;
    
    switch (item.type) {
        case 'course':
            navigateToCourse(data.courseId);
            break;
        case 'path':
            navigateToCourse(data.courseId);
            break;
        case 'module':
            navigateToModule(data.courseId, data.pathId, data.moduleId);
            break;
        case 'lesson':
            navigateToLesson(data.courseId, data.pathId, data.moduleId, data.lessonId);
            break;
    }
}

// Real-time search suggestions
function setupSearchInput() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener('input', (event) => {
        clearTimeout(searchTimeout);
        const query = event.target.value.trim();

        if (query.length < 2) {
            hideSuggestions();
            return;
        }

        // Debounce search
        searchTimeout = setTimeout(() => {
            showSuggestions(query);
        }, 200);
    });

    searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            performSearch();
        } else if (event.key === 'Escape') {
            hideSuggestions();
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-container')) {
            hideSuggestions();
        }
    });
}

function showSuggestions(query) {
    const suggestions = SearchEngine.getSuggestions(query);
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!suggestionsContainer || suggestions.length === 0) {
        hideSuggestions();
        return;
    }

    suggestionsContainer.innerHTML = '';
    suggestionsContainer.classList.remove('hidden');

    suggestions.forEach(suggestion => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'suggestion-item';
        
        const typeIcon = {
            course: '🎓',
            path: '🛤️', 
            module: '📚',
            lesson: '📖'
        };

        suggestionItem.innerHTML = `
            <span class="suggestion-icon">${typeIcon[suggestion.type]}</span>
            <span class="suggestion-text">${highlightSearchTerms(suggestion.text, query)}</span>
            <span class="suggestion-type">${suggestion.type}</span>
        `;

        suggestionItem.addEventListener('click', () => {
            document.getElementById('search-input').value = suggestion.text;
            hideSuggestions();
            performSearch();
        });

        suggestionsContainer.appendChild(suggestionItem);
    });
}

function hideSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.classList.add('hidden');
    }
}

// Make search functions globally accessible
window.performSearch = performSearch;
window.setupSearchInput = setupSearchInput;

// Placeholder for function that will load lesson content into an iframe
function loadLessonInIframe(course, path, module, lesson) {
    const frameContainer = document.getElementById('lesson-viewer-frame-container'); // CHANGED ID
    if (!frameContainer) {
        console.error("Lesson content frame container ('lesson-viewer-frame-container') not found!");
        return;
    }

    // Show loading indicator & clear previous content like an old iframe
    frameContainer.innerHTML = '<p class="loading-indicator">Loading lesson content...</p>';

    // Construct the lesson file path
    const lessonFilePath = `course_content/${path.folder}/${module.folder}/${lesson.file}`;
    console.log(`Loading lesson from: ${lessonFilePath}`);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', `Lesson content: ${lesson.title}`);
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('height', '500px'); // Adjust as needed, or control via CSS
    iframe.style.border = 'none';
    
    iframe.setAttribute('sandbox', 'allow-scripts allow-popups allow-forms allow-same-origin');
    // Super-permissive CSP for debugging content visibility -- Temporarily removed to test framing issue
    // iframe.setAttribute('csp', "default-src * 'unsafe-inline' 'unsafe-eval'; script-src * 'unsafe-inline' 'unsafe-eval'; connect-src * 'unsafe-inline'; img-src * data: blob: 'unsafe-inline'; frame-src *; style-src * 'unsafe-inline'; media-src *; font-src * data:;"); 
    iframe.setAttribute('allow', "fullscreen 'self'"); 

    iframe.onload = () => {
        console.log(`loadLessonInIframe: ONLOAD event fired for: ${lessonFilePath}`);
        
        // Mark lesson as viewed when successfully loaded
        ProgressTracker.markLessonViewed(course.id, path.id, module.id, lesson.id);
        
        // If the loading indicator was the only child, it got replaced by the iframe.
        // If frameContainer.innerHTML was cleared and iframe appended, that's fine.
        // More robustly, ensure only the iframe is present if it loaded successfully.
        // For this specific structure, the iframe is already in frameContainer.
        // We just need to ensure the loading indicator is gone IF it wasn't the only thing cleared.
        // The current structure of clearing frameContainer then appending iframe is simplest.
        const loadingIndicator = frameContainer.querySelector('.loading-indicator');
        if (loadingIndicator && frameContainer.contains(iframe)) { // If iframe is there and indicator somehow persists
            loadingIndicator.remove();
        }
    };
    iframe.onerror = () => {
        console.error(`loadLessonInIframe: ONERROR event fired for: ${lessonFilePath}`);
        // If iframe failed, ensure it's not there and show error.
        iframe.remove(); // Remove the failed iframe
        frameContainer.innerHTML = `<p class="error-message">Error: Could not load lesson '${lesson.title}'. Please check the file path and ensure the lesson content exists.</p>`;
        const errorMsgDiv = frameContainer.querySelector('.error-message');
        if(errorMsgDiv) {
            errorMsgDiv.tabIndex = -1;
            errorMsgDiv.focus();
        }
    };

    // CRITICAL CHANGE: Clear container, append iframe to DOM BEFORE setting src
    frameContainer.innerHTML = ''; // Clear "Loading lesson content..." or any old iframe
    frameContainer.appendChild(iframe); // Add the iframe to the DOM first

    console.log("loadLessonInIframe: iframe appended to DOM, about to set src");
    iframe.src = lessonFilePath; // Now set src
    console.log("loadLessonInIframe: iframe.src has NOW been set to:", lessonFilePath);
    
}

window.addEventListener('hashchange', parseHash);
// Initial parse and render on page load
// We need to ensure loadContent has finished and courseData is available before initial render based on hash.
// So, the initial parseHash and renderCurrentView will be called at the end of loadContent.

async function loadContent() {
    try {
        // Initialize progress tracking first
        ProgressTracker.init();
        
        const response = await fetch('content.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - Could not fetch content.json`);
        }
        let data = await response.json();
        console.log('Raw content loaded:', data);

        data = validateAndSanitizeContent(data);
        console.log('Validated and sanitized content:', data);
        courseData = data; // Store the data globally
        
        // Build search index
        SearchEngine.buildIndex(data.courses);
        
        // Setup search input
        setupSearchInput();
        
        // Clear any previous error messages if content is now successfully loaded and validated
        const mainElement = document.querySelector('main');
        if (mainElement && mainElement.querySelector('.error-message')) {
            mainElement.innerHTML = '<!-- Content will be dynamically injected here -->'; 
        }

        // Initial route parsing and rendering after content is loaded
        parseHash(); 

    } catch (error) {
        console.error('Error loading or validating content:', error);
        displayError(`Error loading or processing course content: ${error.message}. Please check content.json and reload.`);
    }
}

function displayError(message) {
    const mainElement = document.querySelector('main');
    if (mainElement) {
        let errorDiv = mainElement.querySelector('.error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
        } else {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.setAttribute('aria-live', 'assertive');
            errorDiv.setAttribute('tabindex', '-1'); // Make it focusable
            errorDiv.textContent = message;
            mainElement.innerHTML = ''; // Clear previous content before adding error
            mainElement.appendChild(errorDiv);
        }
        errorDiv.focus(); // Set focus to the error message
    } else {
        console.error("Could not find main element to display error.");
    }
}

loadContent(); // This will also trigger the initial parseHash and renderCurrentView via its success path.

// ===========================
// INITIALIZATION
// ===========================

// Initialize AuthManager
let authManager;
if (typeof window !== 'undefined') {
    authManager = new AuthManager();
    
    // Make auth functions globally accessible
    window.authManager = authManager;
    window.showAuthModal = showAuthModal;
    window.hideAuthModal = hideAuthModal;
    window.toggleAuthMode = toggleAuthMode;
    window.showProfileModal = showProfileModal;
    window.hideProfileModal = hideProfileModal;
}

// Expose ProgressTracker globally for debugging
window.ProgressTracker = ProgressTracker;

export {}; // Ensures this file is treated as a module 