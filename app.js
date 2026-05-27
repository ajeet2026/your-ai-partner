// app.js - Main Application Orchestrator & View Controller
document.addEventListener("DOMContentLoaded", () => {
    // Check global services are present
    if (!window.AppStore || !window.AIService) {
        console.error("Core Services (state.js or ai-service.js) not found. Re-check file order.");
        return;
    }

    const Store = window.AppStore;
    const AI = window.AIService;
    
    // Core state variable
    let appState = Store.getState();
    
    // Active diagnostic assessment selections
    let diagnosticAnswers = {};
    
    // Current Active Test context
    let activeTest = null;
    let testTimerInterval = null;
    let testSecondsElapsed = 0;
    let testAnswers = {};
    let activeTestQuestions = [];
    let currentQuestionIndex = 0;

    // Breathing simulator timer
    let breathingInterval = null;
    let breathingCycleIndex = 0; // 0: Inhale, 1: Hold, 2: Exhale, 3: Hold

    // Video Call variables
    let videoCallStream = null;
    let videoCallTimeLeft = 3600; // 1 hour in seconds
    let videoCallTimerInterval = null;
    let videoCallSpeechRecognition = null;
    let videoCallIsMicMuted = false;
    let videoCallIsCamOff = false;
    let videoCallEqualizerInterval = null;

    // UI elements references
    const DOMElements = {
        // Overlays & Sections
        onboardingOverlay: document.getElementById("onboardingOverlay"),
        onboardStep1: document.getElementById("onboardStep1"),
        onboardStep2: document.getElementById("onboardStep2"),
        onboardStep3: document.getElementById("onboardStep3"),
        onboardProgress: document.getElementById("onboardProgress"),
        
        // Navigation & Sidebar
        navItems: document.querySelectorAll(".nav-item"),
        views: document.querySelectorAll(".view-section"),
        sidebarName: document.getElementById("sidebarName"),
        sidebarLevel: document.getElementById("sidebarLevel"),
        sidebarAvatar: document.getElementById("sidebarAvatar"),
        welcomeUserTitle: document.getElementById("welcomeUserTitle"),
        
        // Forms & Buttons
        profileForm: document.getElementById("profileForm"),
        addTaskForm: document.getElementById("addTaskForm"),
        newTaskTitle: document.getElementById("newTaskTitle"),
        newTaskSubject: document.getElementById("newTaskSubject"),
        btnBackToStep1: document.getElementById("btnBackToStep1"),
        btnSubmitOnboardQuiz: document.getElementById("btnSubmitOnboardQuiz"),
        btnFinishOnboarding: document.getElementById("btnFinishOnboarding"),
        btnResetApp: document.getElementById("btnResetApp"),
        btnRebuildSchedule: document.getElementById("btnRebuildSchedule"),
        btnPrintSchedule: document.getElementById("btnPrintSchedule"),
        btnQuickTestQuickstart: document.getElementById("btnQuickTestQuickstart"),
        
        // Dynamic Containers
        diagQuizContainer: document.getElementById("diagQuizContainer"),
        tasksListContainer: document.getElementById("tasksListContainer"),
        timelineScheduleContainer: document.getElementById("timelineScheduleContainer"),
        pendingTasksCount: document.getElementById("pendingTasksCount"),
        unlockedBadgesGallery: document.getElementById("unlockedBadgesGallery"),
        
        // Chat elements
        tutorChatBox: document.getElementById("tutorChatBox"),
        chatInputField: document.getElementById("chatInputField"),
        btnSendChatMessage: document.getElementById("btnSendChatMessage"),
        chatSubjectSelect: document.getElementById("chatSubjectSelect"),
        chatLevelSelect: document.getElementById("chatLevelSelect"),
        chatLangSelect: document.getElementById("chatLangSelect"),
        btnToggleSpeech: document.getElementById("btnToggleSpeech"),
        btnClearChatHistory: document.getElementById("btnClearChatHistory"),
        btnVoiceInputTrigger: document.getElementById("btnVoiceInputTrigger"),
        speechListeningIndicator: document.getElementById("speechListeningIndicator"),
        btnSimulateUpload: document.getElementById("btnSimulateUpload"),
        uploadModalOverlay: document.getElementById("uploadModalOverlay"),
        btnCancelSimulateUpload: document.getElementById("btnCancelSimulateUpload"),
        simUploadPanel: document.getElementById("simUploadPanel"),
        simUploadLabel: document.getElementById("simUploadLabel"),
        btnCancelSimUpload: document.getElementById("btnCancelSimUpload"),
        
        // Mock Test Center
        mockTestSubjectSelect: document.getElementById("mockTestSubjectSelect"),
        mockTestCustomSubjectInput: document.getElementById("mockTestCustomSubjectInput"),
        btnStartMockTestEngine: document.getElementById("btnStartMockTestEngine"),
        testStartPrompt: document.getElementById("testStartPrompt"),
        testRunningPanel: document.getElementById("testRunningPanel"),
        testTopicHeader: document.getElementById("testTopicHeader"),
        testTimeTracker: document.getElementById("testTimeTracker"),
        testQuestionCounter: document.getElementById("testQuestionCounter"),
        testActiveQuestionText: document.getElementById("testActiveQuestionText"),
        testActiveOptionsGrid: document.getElementById("testActiveOptionsGrid"),
        btnTestNextQuestion: document.getElementById("btnTestNextQuestion"),
        btnTestSubmitExam: document.getElementById("btnTestSubmitExam"),
        perfMockStatsContainer: document.getElementById("perfMockStatsContainer"),
        perfMockStatsPlaceholder: document.getElementById("perfMockStatsPlaceholder"),
        perfLogAccuracy: document.getElementById("perfLogAccuracy"),
        perfLogTotalTests: document.getElementById("perfLogTotalTests"),
        perfLogRank: document.getElementById("perfLogRank"),
        testHistoryLogsBox: document.getElementById("testHistoryLogsBox"),

        // Video Call Simulator elements
        btnStartVideoCallSimulator: document.getElementById("btnStartVideoCallSimulator"),
        videoCallOverlay: document.getElementById("videoCallOverlay"),
        videoCallTimerText: document.getElementById("videoCallTimerText"),
        videoCallLocalVideo: document.getElementById("videoCallLocalVideo"),
        studentCallPlaceholder: document.getElementById("studentCallPlaceholder"),
        aiMentorCallStatusText: document.getElementById("aiMentorCallStatusText"),
        aiVoiceWaveBars: document.getElementById("aiVoiceWaveBars"),
        videoCallSubtitleText: document.getElementById("videoCallSubtitleText"),
        btnVideoCallToggleMic: document.getElementById("btnVideoCallToggleMic"),
        btnVideoCallToggleCam: document.getElementById("btnVideoCallToggleCam"),
        btnVideoCallEndCall: document.getElementById("btnVideoCallEndCall"),

        // Wellness elements
        wellnessForm: document.getElementById("wellnessForm"),
        moodCards: document.querySelectorAll(".mood-card"),
        wellnessStressSlider: document.getElementById("wellnessStressSlider"),
        wellnessSleepSlider: document.getElementById("wellnessSleepSlider"),
        wellnessNotes: document.getElementById("wellnessNotes"),
        stressSliderValue: document.getElementById("stressSliderValue"),
        sleepSliderValue: document.getElementById("sleepSliderValue"),
        wellnessSuggestionPanelText: document.getElementById("wellnessSuggestionPanelText"),
        btnTriggerBreathingSimulator: document.getElementById("btnTriggerBreathingSimulator"),
        breathWidgetBox: document.getElementById("breathWidgetBox"),
        breathBubbleText: document.getElementById("breathBubbleText"),
        breathCircleInner: document.getElementById("breathCircleInner"),
        breathTimerFill: document.getElementById("breathTimerFill"),
        wellnessHelplineBanner: document.getElementById("wellnessHelplineBanner"),
        btnDismissHelplineBanner: document.getElementById("btnDismissHelplineBanner"),

        // Billings & Career
        btnTriggerMockCheckout: document.getElementById("btnTriggerMockCheckout"),
        checkoutModalOverlay: document.getElementById("checkoutModalOverlay"),
        btnCancelCheckout: document.getElementById("btnCancelCheckout"),
        btnSubmitMockCheckout: document.getElementById("btnSubmitMockCheckout"),
        mockCheckoutPaymentType: document.getElementById("mockCheckoutPaymentType"),
        checkoutMockTitle: document.getElementById("checkoutMockTitle"),
        checkoutSimulatedDescContainer: document.getElementById("checkoutSimulatedDescContainer"),
        checkoutRealUpiContainer: document.getElementById("checkoutRealUpiContainer"),
        checkoutUpiQrImage: document.getElementById("checkoutUpiQrImage"),
        checkoutUpiPayeeName: document.getElementById("checkoutUpiPayeeName"),
        checkoutUpiId: document.getElementById("checkoutUpiId"),
        checkoutUpiTrxInput: document.getElementById("checkoutUpiTrxInput"),
        settingsOwnerUpiIdInput: document.getElementById("settingsOwnerUpiIdInput"),
        settingsOwnerPayeeNameInput: document.getElementById("settingsOwnerPayeeNameInput"),
        pricingTierContainer: document.getElementById("pricingTierContainer"),
        premiumActiveContainer: document.getElementById("premiumActiveContainer"),
        btnTriggerScholarshipModal: document.getElementById("btnTriggerScholarshipModal"),
        scholarshipModalOverlay: document.getElementById("scholarshipModalOverlay"),
        btnCancelScholarship: document.getElementById("btnCancelScholarship"),
        scholarshipForm: document.getElementById("scholarshipForm"),
        scholarshipReasonInput: document.getElementById("scholarshipReasonInput"),
        careerPathSelector: document.getElementById("careerPathSelector"),
        btnGenerateCareerRoadmap: document.getElementById("btnGenerateCareerRoadmap"),
        careerRoadmapTitle: document.getElementById("careerRoadmapTitle"),
        careerRoadmapDesc: document.getElementById("careerRoadmapDesc"),
        careerRoadmapStepsList: document.getElementById("careerRoadmapStepsList"),
        
        // Ollama & SQLite Production elements
        ollamaStatusBadge: document.getElementById("ollamaStatusBadge"),
        ollamaStatusDot: document.getElementById("ollamaStatusDot"),
        ollamaModelName: document.getElementById("ollamaModelName"),
        dbSyncText: document.getElementById("dbSyncText"),
        btnOpenServerSettings: document.getElementById("btnOpenServerSettings"),
        aiSettingsModalOverlay: document.getElementById("aiSettingsModalOverlay"),
        btnCancelAiSettings: document.getElementById("btnCancelAiSettings"),
        settingsAiLocationSelect: document.getElementById("settingsAiLocationSelect"),
        geminiKeyGroup: document.getElementById("geminiKeyGroup"),
        settingsGeminiKeyInput: document.getElementById("settingsGeminiKeyInput"),
        ollamaModelGroup: document.getElementById("ollamaModelGroup"),
        settingsOllamaModelSelect: document.getElementById("settingsOllamaModelSelect"),
        settingsCustomModelInput: document.getElementById("settingsCustomModelInput"),
        settingsOllamaStatus: document.getElementById("settingsOllamaStatus"),
        btnRefreshServerStatus: document.getElementById("btnRefreshServerStatus"),
        aiSettingsForm: document.getElementById("aiSettingsForm"),
        btnWipeSqliteDb: document.getElementById("btnWipeSqliteDb"),
        examGenerationOverlay: document.getElementById("examGenerationOverlay"),
        examGenerationStatusText: document.getElementById("examGenerationStatusText"),
        
        // Multi-User Authentication Elements
        authModalOverlay: document.getElementById("authModalOverlay"),
        tabSignIn: document.getElementById("tabSignIn"),
        tabSignUp: document.getElementById("tabSignUp"),
        authForm: document.getElementById("authForm"),
        authNameGroup: document.getElementById("authNameGroup"),
        authNameInput: document.getElementById("authNameInput"),
        authEmailInput: document.getElementById("authEmailInput"),
        authPasswordInput: document.getElementById("authPasswordInput"),
        btnSubmitAuth: document.getElementById("btnSubmitAuth"),
        btnContinueAsGuest: document.getElementById("btnContinueAsGuest"),
        btnOpenAuthModal: document.getElementById("btnOpenAuthModal"),
        btnSignOut: document.getElementById("btnSignOut"),
        sidebarEmail: document.getElementById("sidebarEmail")
    };

    let activityChartInstance = null;
    let skillChartInstance = null;
    let ttsActive = false;
    let uploadFilePending = null;

    // ==========================================
    // INITIALIZATION & STATE SUBSCRIBER
    // ==========================================
    function checkAuthStatus() {
        if (!Store.token && !Store.isGuest) {
            DOMElements.authModalOverlay.classList.add("active");
        } else {
            DOMElements.authModalOverlay.classList.remove("active");
        }
    }

    function setupAuthListeners() {
        let isSignUpMode = false;
        
        // Tab switching
        DOMElements.tabSignIn.addEventListener("click", () => {
            isSignUpMode = false;
            DOMElements.tabSignIn.style.color = "var(--color-primary)";
            DOMElements.tabSignIn.style.borderBottom = "2px solid var(--color-primary)";
            DOMElements.tabSignUp.style.color = "var(--text-muted)";
            DOMElements.tabSignUp.style.borderBottom = "none";
            
            DOMElements.authNameGroup.style.display = "none";
            DOMElements.btnSubmitAuth.innerText = "Sign In to Account 🚀";
        });
        
        DOMElements.tabSignUp.addEventListener("click", () => {
            isSignUpMode = true;
            DOMElements.tabSignUp.style.color = "var(--color-primary)";
            DOMElements.tabSignUp.style.borderBottom = "2px solid var(--color-primary)";
            DOMElements.tabSignIn.style.color = "var(--text-muted)";
            DOMElements.tabSignIn.style.borderBottom = "none";
            
            DOMElements.authNameGroup.style.display = "block";
            DOMElements.btnSubmitAuth.innerText = "Create New Account 🪐";
        });
        
        // Continue as Guest
        DOMElements.btnContinueAsGuest.addEventListener("click", (e) => {
            e.preventDefault();
            Store.setGuestMode(true);
            DOMElements.authModalOverlay.classList.remove("active");
            
            // Re-evaluate onboarding/dashboard visual state
            if (Store.state.onboarded) {
                DOMElements.onboardingOverlay.style.display = "none";
                renderActivityChart();
            } else {
                DOMElements.onboardingOverlay.style.display = "flex";
                loadDiagnosticQuizQuestions();
            }
        });
        
        // Open Auth modal
        DOMElements.btnOpenAuthModal.addEventListener("click", () => {
            DOMElements.authModalOverlay.classList.add("active");
        });
        
        // Sign Out
        DOMElements.btnSignOut.addEventListener("click", () => {
            if (confirm("Are you sure you want to sign out? Your local guest profile will be cleared if you log out of Guest Mode, but your database cloud profile is perfectly secure.")) {
                Store.signOutUser();
                DOMElements.onboardingOverlay.style.display = "flex";
                DOMElements.authModalOverlay.classList.add("active");
            }
        });
        
        // Submit Credentials Form
        DOMElements.authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const emailVal = DOMElements.authEmailInput.value.trim();
            const passwordVal = DOMElements.authPasswordInput.value;
            const nameVal = DOMElements.authNameInput.value.trim();
            
            DOMElements.btnSubmitAuth.disabled = true;
            DOMElements.btnSubmitAuth.innerText = isSignUpMode ? "Registering account..." : "Signing in...";
            
            try {
                let result;
                if (isSignUpMode) {
                    result = await Store.signupUser(emailVal, passwordVal, nameVal);
                } else {
                    result = await Store.loginUser(emailVal, passwordVal);
                }
                
                if (result.success) {
                    DOMElements.authModalOverlay.classList.remove("active");
                    DOMElements.authEmailInput.value = "";
                    DOMElements.authPasswordInput.value = "";
                    DOMElements.authNameInput.value = "";
                    
                    if (Store.state.onboarded) {
                        DOMElements.onboardingOverlay.style.display = "none";
                        renderActivityChart();
                    } else {
                        DOMElements.onboardingOverlay.style.display = "flex";
                        loadDiagnosticQuizQuestions();
                    }
                } else {
                    alert(`❌ Authentication Error: ${result.error}`);
                }
            } catch (err) {
                alert(`❌ Network failure syncing credentials to database: ${err.message}`);
            } finally {
                DOMElements.btnSubmitAuth.disabled = false;
                DOMElements.btnSubmitAuth.innerText = isSignUpMode ? "Create New Account 🪐" : "Sign In to Account 🚀";
            }
        });
    }

    // INITIALIZATION & STATE SUBSCRIBER
    // ==========================================
    function init() {
        // Handle initial authentication checks & setups
        setupAuthListeners();
        checkAuthStatus();

        // Toggle view events
        DOMElements.navItems.forEach(item => {
            item.addEventListener("click", () => {
                const targetView = item.getAttribute("data-view");
                switchView(targetView);
            });
        });

        // Initialize user details UI
        updateUI(appState);
        
        // Start live Ollama checks & SQLite sync indicator
        checkOllamaServerStatus();
        updateDbSyncIndicator();
        ollamaStatusInterval = setInterval(checkOllamaServerStatus, 10000);
        
        // Listen to state changes
        Store.subscribe((newState) => {
            appState = newState;
            updateUI(newState);
            updateDbSyncIndicator();
        });

        // Check Stripe Checkout success / cancel query params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('checkout_success')) {
            Store.state.user.premium = true;
            Store.unlockBadge('Elite Thinker');
            Store.addXP(200);
            Store.saveState();
            window.history.replaceState({}, document.title, window.location.pathname);
            alert("🎉 SUCCESS! Your Premium subscription was processed securely via Stripe. All advanced tools are now unlocked!");
        } else if (urlParams.has('checkout_cancel')) {
            window.history.replaceState({}, document.title, window.location.pathname);
            alert("⚠️ Subscription checkout was canceled. You can try again anytime.");
        }

        // Check if user is already onboarded (if they are also auth/guest verified)
        if (Store.token || Store.isGuest) {
            if (appState.onboarded) {
                DOMElements.onboardingOverlay.style.display = "none";
                renderActivityChart();
            } else {
                DOMElements.onboardingOverlay.style.display = "flex";
                loadDiagnosticQuizQuestions();
            }
        } else {
            // Keep onboarding overlay hidden initially, let auth flow dictate startup
            DOMElements.onboardingOverlay.style.display = "none";
        }

        setupOnboardingListeners();
        setupPlannerListeners();
        setupChatTutorListeners();
        setupMockTestListeners();
        setupWellnessListeners();
        setupBillingListeners();
        setupVideoCallListeners();
        setupServerSettingsListeners();

        // Default: generate a starting career roadmap
        generateAndRenderCareerRoadmap("ai");
    }

    function switchView(targetView) {
        DOMElements.navItems.forEach(n => n.classList.remove("active"));
        DOMElements.views.forEach(v => v.classList.remove("active"));
        
        const activeNav = Array.from(DOMElements.navItems).find(n => n.getAttribute("data-view") === targetView);
        const activeSection = document.getElementById(`view-${targetView}`);
        
        if (activeNav && activeSection) {
            activeNav.classList.add("active");
            activeSection.classList.add("active");
        }
        
        // Re-render chart if switching to overview
        if (targetView === "overview") {
            setTimeout(renderActivityChart, 50);
        }
    }

    // Refresh UI elements based on state change
    function updateUI(state) {
        // Handle auth visibility in sidebar
        if (Store.token) {
            DOMElements.sidebarEmail.innerText = Store.email || '';
            DOMElements.sidebarEmail.style.display = 'block';
            DOMElements.btnOpenAuthModal.style.display = 'none';
            DOMElements.btnSignOut.style.display = 'block';
        } else {
            DOMElements.sidebarEmail.innerText = 'Guest Mode';
            DOMElements.sidebarEmail.style.display = 'block';
            DOMElements.btnOpenAuthModal.style.display = 'block';
            DOMElements.btnSignOut.style.display = 'none';
        }

        if (!state.onboarded) return;

        const isPremium = state.user && state.user.premium;

        // Header info
        DOMElements.welcomeUserTitle.innerHTML = `Welcome back, ${state.user.name || "Scholar"}!${isPremium ? ' <i class="fa-solid fa-crown" style="color: #facc15; font-size:16px; margin-left:6px;" title="Premium Member"></i>' : ''}`;
        DOMElements.sidebarName.innerHTML = `${state.user.name || "Student Partner"}${isPremium ? ' <i class="fa-solid fa-crown" style="color: #facc15; font-size:12px; margin-left:4px;" title="Premium Member"></i>' : ''}`;
        DOMElements.sidebarLevel.innerText = `Level ${state.stats.level} Student`;
        DOMElements.sidebarAvatar.innerText = (state.user.name || "S").charAt(0).toUpperCase();

        // Dashboard quick stats cards
        document.getElementById("statStreak").innerText = `${state.stats.streak} ${state.stats.streak === 1 ? 'Day' : 'Days'}`;
        document.getElementById("statXp").innerText = `${state.stats.xp} XP`;
        document.getElementById("statMinutes").innerText = `${state.stats.totalStudyMinutes} Mins`;
        document.getElementById("statTests").innerText = `${state.stats.testsCompleted} ${state.stats.testsCompleted === 1 ? 'Test' : 'Tests'}`;

        // Dynamic test accuracy text
        const accuracyEl = document.getElementById("statAccuracyMeta");
        if (state.tests.length > 0) {
            const sumAcc = state.tests.reduce((acc, t) => acc + t.accuracy, 0);
            const avgAcc = Math.round(sumAcc / state.tests.length);
            accuracyEl.innerHTML = `<i class="fa-solid fa-bullseye" style="color:var(--color-success)"></i> Avg Accuracy: ${avgAcc}%`;
            DOMElements.perfLogAccuracy.innerText = `${avgAcc}%`;
        } else {
            accuracyEl.innerHTML = `<i class="fa-solid fa-hourglass-start"></i> No tests completed`;
            DOMElements.perfLogAccuracy.innerText = `--`;
        }

        DOMElements.perfLogTotalTests.innerText = `${state.stats.testsCompleted} ${state.stats.testsCompleted === 1 ? 'Test' : 'Tests'}`;

        // Load tasks count badges
        const pending = state.tasks.filter(t => !t.completed).length;
        DOMElements.pendingTasksCount.innerText = `${pending} Active`;
        if (pending === 0) {
            DOMElements.pendingTasksCount.className = "badge badge-success";
        } else {
            DOMElements.pendingTasksCount.className = "badge badge-cyan";
        }

        // Toggle Billing pricing containers based on Premium status
        if (DOMElements.pricingTierContainer && DOMElements.premiumActiveContainer) {
            if (isPremium) {
                DOMElements.pricingTierContainer.style.display = "none";
                DOMElements.premiumActiveContainer.style.display = "block";
            } else {
                DOMElements.pricingTierContainer.style.display = "block";
                DOMElements.premiumActiveContainer.style.display = "none";
            }
        }

        // Render lists
        renderTasksList(state.tasks);
        renderDailyScheduleTimeline();
        renderUnlockedBadges(state.unlockedBadges);
        renderTestHistoryLogs();
    }

    // ==========================================
    // MODULE 1: ONBOARDING FLOW CONTROLLER
    // ==========================================
    function loadDiagnosticQuizQuestions() {
        const qContainer = DOMElements.diagQuizContainer;
        qContainer.innerHTML = "";
        
        AI.diagnosticQuestions.forEach((q) => {
            const box = document.createElement("div");
            box.className = "diag-question-box";
            box.innerHTML = `
                <div class="diag-question-text">${q.id}. [${q.subject}] ${q.question}</div>
                <div class="diag-options-grid" data-qid="${q.id}">
                    ${q.options.map((opt, idx) => `
                        <div class="diag-option-row" data-val="${idx}">
                            <div class="diag-option-bullet">${String.fromCharCode(65 + idx)}</div>
                            <span style="font-size:13px;">${opt}</span>
                        </div>
                    `).join('')}
                </div>
            `;
            qContainer.appendChild(box);
        });

        // Set up options selection highlight
        const optionRows = qContainer.querySelectorAll(".diag-option-row");
        optionRows.forEach(row => {
            row.addEventListener("click", () => {
                const parent = row.parentElement;
                const qId = parent.getAttribute("data-qid");
                
                // Clear selection
                parent.querySelectorAll(".diag-option-row").forEach(r => r.classList.remove("selected"));
                row.classList.add("selected");
                
                diagnosticAnswers[qId] = row.getAttribute("data-val");
            });
        });
    }

    function setupOnboardingListeners() {
        const profClassSelect = document.getElementById("profClass");
        const profClassCustomInput = document.getElementById("profClassCustomInput");
        
        profClassSelect.addEventListener("change", (e) => {
            if (e.target.value === "Custom") {
                profClassCustomInput.style.display = "block";
                profClassCustomInput.setAttribute("required", "true");
                profClassCustomInput.focus();
            } else {
                profClassCustomInput.style.display = "none";
                profClassCustomInput.removeAttribute("required");
                profClassCustomInput.value = "";
            }
        });

        // Step 1 Form Submission
        DOMElements.profileForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            // Toggle step visuals
            DOMElements.onboardStep1.classList.remove("active");
            DOMElements.onboardStep2.classList.add("active");
            DOMElements.onboardProgress.style.width = "50%";
            document.querySelector(".onboarding-step-indicator[data-step='2']").classList.add("active");
            document.querySelector(".onboarding-step-indicator[data-step='1']").classList.add("completed");
        });

        // Step 2 Diagnostic Quiz Submission
        DOMElements.btnSubmitOnboardQuiz.addEventListener("click", () => {
            // Ensure all questions are answered
            const totalQCount = AI.diagnosticQuestions.length;
            const answeredCount = Object.keys(diagnosticAnswers).length;
            
            if (answeredCount < totalQCount) {
                alert("Please answer all diagnostic assessment questions to help the AI map your skill levels!");
                return;
            }

            // Run evaluation
            const report = AI.evaluateDiagnostic(diagnosticAnswers);
            
            // Build the dynamic radar skill graph
            renderSkillGraphChart(report.skills);

            // Pop values in final summary card
            document.getElementById("diagScoreBadge").innerText = `Score: ${report.percentage}%`;
            document.getElementById("diagStyleBadge").innerText = report.learningStyle;
            document.getElementById("diagFocusScore").innerText = `${report.focusScore}/100`;

            const weakString = Array.from(document.getElementById("profWeak").selectedOptions).map(o => o.value).join(", ");
            document.getElementById("diagSummaryText").innerText = `Diagnostic completed! Based on your target exam (${document.getElementById("profExam").value}) and score of ${report.percentage}%, the AI Tutor will tailor learning blocks. Weak topics like [${weakString || 'General topics'}] have been scheduled as study planners revision priorities.`;

            // Transition step view
            DOMElements.onboardStep2.classList.remove("active");
            DOMElements.onboardStep3.classList.add("active");
            DOMElements.onboardProgress.style.width = "100%";
            document.querySelector(".onboarding-step-indicator[data-step='3']").classList.add("active");
            document.querySelector(".onboarding-step-indicator[data-step='2']").classList.add("completed");
        });

        DOMElements.btnBackToStep1.addEventListener("click", () => {
            DOMElements.onboardStep2.classList.remove("active");
            DOMElements.onboardStep1.classList.add("active");
            DOMElements.onboardProgress.style.width = "0%";
            document.querySelector(".onboarding-step-indicator[data-step='2']").classList.remove("active");
            document.querySelector(".onboarding-step-indicator[data-step='1']").classList.remove("completed");
        });

        // Onboarding final approval button
        DOMElements.btnFinishOnboarding.addEventListener("click", () => {
            const weakSelect = document.getElementById("profWeak");
            const weakSubjectsArr = Array.from(weakSelect.selectedOptions).map(opt => opt.value);
            
            const profClassSelect = document.getElementById("profClass");
            const profClassCustomInput = document.getElementById("profClassCustomInput");
            let classYearVal = profClassSelect.value;
            if (classYearVal === "Custom") {
                classYearVal = profClassCustomInput.value.trim() || "Custom Exam Type";
            }

            const profile = {
                name: document.getElementById("profName").value,
                age: parseInt(document.getElementById("profAge").value),
                classYear: classYearVal,
                stream: 'General',
                targetExam: document.getElementById("profExam").value,
                schoolCollege: 'My Institute',
                currentMarks: 'Baseline 70%',
                weakSubjects: weakSubjectsArr,
                strongSubjects: ["General Aptitude"],
                studyHours: parseInt(document.getElementById("profHours").value) || 4,
                preferredLanguage: document.getElementById("profLang").value
            };

            const report = AI.evaluateDiagnostic(diagnosticAnswers);
            
            // Save state
            Store.completeOnboarding(profile, report.skills);
            
            // Hide Overlay
            DOMElements.onboardingOverlay.style.display = "none";
            
            // Load Charts & Swapping Views
            renderActivityChart();
            switchView("overview");
        });

        // Reset profile option in side footer
        DOMElements.btnResetApp.addEventListener("click", () => {
            if (confirm("Are you sure you want to reset your study streaks, logged mood tasks, and onboarding details?")) {
                Store.resetState();
                window.location.reload();
            }
        });
    }

    // ==========================================
    // CHART RENDERING (CHART.JS INTEGRATION)
    // ==========================================
    function renderSkillGraphChart(skillsData) {
        const ctx = document.getElementById('skillGraphCanvas').getContext('2d');
        
        if (skillChartInstance) skillChartInstance.destroy();
        
        skillChartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: Object.keys(skillsData),
                datasets: [{
                    label: 'Starting Skill Score',
                    data: Object.values(skillsData),
                    backgroundColor: 'rgba(0, 242, 254, 0.2)',
                    borderColor: '#00f2fe',
                    borderWidth: 2,
                    pointBackgroundColor: '#00f2fe',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#00f2fe'
                }]
            },
            options: {
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } },
                        ticks: { display: false, max: 100, min: 0 }
                    }
                },
                plugins: {
                    legend: { display: false }
                },
                responsive: false,
                maintainAspectRatio: false
            }
        });
    }

    function renderActivityChart() {
        const ctx = document.getElementById('overviewActivityChart').getContext('2d');
        if (!ctx) return;

        if (activityChartInstance) activityChartInstance.destroy();

        // Simulate daily activity metrics based on checklist tasks completed or mock tests taken
        activityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                    {
                        label: 'Study Hours Consumed',
                        data: [3.5, 4.0, 3.0, 5.5, 4.0, 2.0, 6.0],
                        borderColor: '#00f2fe',
                        backgroundColor: 'rgba(0, 242, 254, 0.05)',
                        tension: 0.4,
                        borderWidth: 3,
                        fill: true
                    },
                    {
                        label: 'Daily Task Targets',
                        data: [4, 4, 4, 4, 4, 3, 5],
                        borderColor: '#a855f7',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 12 } }
                    }
                },
                scales: {
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { color: '#94a3b8' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#94a3b8' }
                    }
                }
            }
        });
    }

    // ==========================================
    // MODULE 2: STUDY PLANNER VIEW CHECKS
    // ==========================================
    function renderTasksList(tasks) {
        const container = DOMElements.tasksListContainer;
        container.innerHTML = "";

        if (tasks.length === 0) {
            container.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--text-dim);">No tasks scheduled. Add a task above!</div>`;
            return;
        }

        tasks.forEach(task => {
            const div = document.createElement("div");
            div.className = `task-item ${task.completed ? 'completed' : ''}`;
            div.innerHTML = `
                <div class="task-left">
                    <div class="custom-checkbox" data-tid="${task.id}">
                        ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
                    </div>
                    <div class="task-title-group">
                        <span class="task-title">${task.title}</span>
                        <span class="task-subject">${task.subject} • Target: ${task.deadline}</span>
                    </div>
                </div>
                <div class="task-right">
                    <span class="task-hours">${task.studyHours || 1} Hr</span>
                    <i class="fa-regular fa-trash-can task-delete" data-tid="${task.id}"></i>
                </div>
            `;
            container.appendChild(div);
        });

        // Checklist complete event
        container.querySelectorAll(".custom-checkbox").forEach(box => {
            box.addEventListener("click", () => {
                const tid = box.getAttribute("data-tid");
                Store.toggleTask(tid);
            });
        });

        // Delete event
        container.querySelectorAll(".task-delete").forEach(trash => {
            trash.addEventListener("click", () => {
                const tid = trash.getAttribute("data-tid");
                Store.deleteTask(tid);
            });
        });
    }

    function renderDailyScheduleTimeline() {
        const container = DOMElements.timelineScheduleContainer;
        container.innerHTML = "";

        const list = AI.generateSchedule(
            appState.user.targetExam,
            appState.user.studyHours,
            appState.user.weakSubjects
        );

        list.forEach(slot => {
            const card = document.createElement("div");
            card.className = `timeline-card ${slot.type}`;
            card.innerHTML = `
                <div class="timeline-time">${slot.time}</div>
                <div class="timeline-activity">${slot.activity}</div>
            `;
            container.appendChild(card);
        });
    }

    function setupPlannerListeners() {
        DOMElements.addTaskForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const title = DOMElements.newTaskTitle.value.trim();
            const subj = DOMElements.newTaskSubject.value;
            
            if (title) {
                Store.addTask({
                    title,
                    subject: subj,
                    category: 'planning',
                    deadline: 'Tomorrow',
                    studyHours: 1.5
                });
                DOMElements.newTaskTitle.value = "";
            }
        });

        // Rebuild schedule button
        DOMElements.btnRebuildSchedule.addEventListener("click", () => {
            Store.generateInitialTasks();
            alert("Success: Recalculated personalized target roadmap based on your profile strong & weak subjects!");
        });

        // Simulated print/export schedule
        DOMElements.btnPrintSchedule.addEventListener("click", () => {
            window.print();
        });

        // Quick test trigger on landing dashboard view
        DOMElements.btnQuickTestQuickstart.addEventListener("click", () => {
            switchView("mocktest");
        });
    }

    // ==========================================
    // MODULE 3: AI LEARNING ASSISTANT (CHAT)
    // ==========================================
    function setupChatTutorListeners() {
        // Render existing chats first
        renderChatHistory();

        // Send chat button
        DOMElements.btnSendChatMessage.addEventListener("click", handleSendChat);
        
        DOMElements.chatInputField.addEventListener("keydown", (e) => {
            if (e.key === "Enter") handleSendChat();
        });

        DOMElements.btnClearChatHistory.addEventListener("click", () => {
            if (confirm("Clear your chat logs with the AI Tutor?")) {
                Store.clearChat();
                renderChatHistory();
            }
        });

        // Voice output reading toggle
        DOMElements.btnToggleSpeech.addEventListener("click", () => {
            ttsActive = !ttsActive;
            if (ttsActive) {
                DOMElements.btnToggleSpeech.classList.add("active");
                DOMElements.btnToggleSpeech.style.borderColor = "var(--color-success)";
                DOMElements.btnToggleSpeech.style.color = "var(--color-success)";
                AI.speak("Voice output mode active! I will now read responses aloud.");
            } else {
                DOMElements.btnToggleSpeech.classList.remove("active");
                DOMElements.btnToggleSpeech.style.borderColor = "";
                DOMElements.btnToggleSpeech.style.color = "";
                AI.stopSpeaking();
            }
        });

        // Simulated upload modal bindings
        DOMElements.btnSimulateUpload.addEventListener("click", () => {
            DOMElements.uploadModalOverlay.classList.add("active");
        });

        DOMElements.btnCancelSimulateUpload.addEventListener("click", () => {
            DOMElements.uploadModalOverlay.classList.remove("active");
        });

        // Image file mock selected
        DOMElements.uploadModalOverlay.querySelectorAll(".diag-option-row").forEach(row => {
            row.addEventListener("click", () => {
                const fName = row.getAttribute("data-upload-file");
                uploadFilePending = fName;
                
                DOMElements.simUploadLabel.innerText = fName;
                DOMElements.simUploadPanel.style.display = "flex";
                
                DOMElements.uploadModalOverlay.classList.remove("active");
            });
        });

        DOMElements.btnCancelSimUpload.addEventListener("click", () => {
            uploadFilePending = null;
            DOMElements.simUploadPanel.style.display = "none";
        });

        // Simulated Speech-to-Text Voice Inputs Trigger
        DOMElements.btnVoiceInputTrigger.addEventListener("click", () => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                const recognition = new SpeechRecognition();
                
                recognition.lang = DOMElements.chatLangSelect.value === 'Hindi' ? 'hi-IN' : 'en-US';
                recognition.interimResults = false;
                recognition.maxAlternatives = 1;

                DOMElements.speechListeningIndicator.style.display = "block";
                recognition.start();

                recognition.onresult = (event) => {
                    const speechResult = event.results[0][0].transcript;
                    DOMElements.chatInputField.value = speechResult;
                    DOMElements.speechListeningIndicator.style.display = "none";
                };

                recognition.onerror = (e) => {
                    console.error("Speech Recognition Error:", e);
                    DOMElements.speechListeningIndicator.style.display = "none";
                    alert("Voice transcription failed or permission denied.");
                };

                recognition.onspeechend = () => {
                    DOMElements.speechListeningIndicator.style.display = "none";
                };
            } else {
                alert("Speech recognition is not supported in this browser. Please use Chrome/Safari.");
            }
        });
    }

    function renderChatHistory() {
        const box = DOMElements.tutorChatBox;
        box.innerHTML = "";

        appState.chatHistory.forEach(msg => {
            const div = document.createElement("div");
            div.className = `chat-message ${msg.sender}`;
            
            let renderedText = '';
            if (msg.sender === 'ai' && typeof marked !== 'undefined') {
                // Use marked.js to render AI markdown responses properly
                try {
                    renderedText = marked.parse(msg.text);
                } catch (e) {
                    renderedText = msg.text.split("\n").map(l => `<p>${l}</p>`).join('');
                }
            } else {
                renderedText = msg.text.split("\n").map(l => {
                    if (l.startsWith("💡") || l.startsWith("📋") || l.startsWith("📐")) {
                        return `<p style="margin-top:8px;">${l}</p>`;
                    }
                    return `<p>${l}</p>`;
                }).join('');
            }

            div.innerHTML = `
                <div class="chat-msg-header">
                    <span>${msg.sender === 'ai' ? msg.agent : 'You'}</span>
                    <span class="chat-msg-time">${msg.time}</span>
                </div>
                <div class="chat-msg-text">${renderedText}</div>
            `;
            box.appendChild(div);
        });

        // Auto scroll
        box.scrollTop = box.scrollHeight;
    }

    async function handleSendChat() {
        const text = DOMElements.chatInputField.value.trim();
        if (!text && !uploadFilePending) return;

        let query = text;
        if (uploadFilePending) {
            query = `[Simulated File Upload: ${uploadFilePending}] ` + (text || "Explain this doubt step-by-step.");
        }

        // Add User Bubble
        Store.addChatMessage('user', query);
        DOMElements.chatInputField.value = "";
        
        // Hide upload simulator if active
        uploadFilePending = null;
        DOMElements.simUploadPanel.style.display = "none";
        
        renderChatHistory();

        // Create and append a Typing Bubble
        const box = DOMElements.tutorChatBox;
        const typingDiv = document.createElement("div");
        typingDiv.className = "chat-message ai";
        typingDiv.id = "chatTypingIndicator";
        typingDiv.innerHTML = `
            <div class="chat-msg-header">
                <span>Tutor Agent</span>
            </div>
            <div class="chat-msg-text" style="color: var(--text-muted); font-style: italic;">
                <i class="fa-solid fa-circle-notch fa-spin"></i> AI is thinking... generating your personalized response (this may take 15-30 seconds)
            </div>
        `;
        box.appendChild(typingDiv);
        box.scrollTop = box.scrollHeight;

        const subject = DOMElements.chatSubjectSelect.value;
        const level = DOMElements.chatLevelSelect.value;
        const lang = DOMElements.chatLangSelect.value;
        
        try {
            // Get live AI response (Ollama or simulated fallback)
            const reply = await AI.getTutorResponse(query, subject, level, lang);
            
            // Remove typing indicator
            const indicator = document.getElementById("chatTypingIndicator");
            if (indicator) indicator.remove();
            
            Store.addChatMessage('ai', reply, 'Tutor Agent');
            renderChatHistory();
            
            // Speak if audio toggle is on
            if (ttsActive) {
                const spokenText = reply.replace(/[\*\`💡📋📐⚠️]/g, '');
                AI.speak(spokenText);
            }

            Store.addXP(10); // Reward for asking educational questions!
        } catch (e) {
            console.error("Chat error: ", e);
            const indicator = document.getElementById("chatTypingIndicator");
            if (indicator) indicator.remove();
        }
    }

    // ==========================================
    // MODULE 4: MOCK TEST ENGINE
    // ==========================================
    function setupMockTestListeners() {
        // Toggle custom subject text box display
        DOMElements.mockTestSubjectSelect.addEventListener("change", (e) => {
            if (e.target.value === "Custom") {
                DOMElements.mockTestCustomSubjectInput.style.display = "block";
                DOMElements.mockTestCustomSubjectInput.focus();
            } else {
                DOMElements.mockTestCustomSubjectInput.style.display = "none";
                DOMElements.mockTestCustomSubjectInput.value = "";
            }
        });

        DOMElements.btnStartMockTestEngine.addEventListener("click", () => {
            let subj = DOMElements.mockTestSubjectSelect.value;
            if (subj === "Custom") {
                subj = DOMElements.mockTestCustomSubjectInput.value.trim();
                if (!subj) {
                    alert("Please enter a custom subject name to begin your timed test!");
                    return;
                }
            }
            startTimedPracticeExam(subj);
        });

        DOMElements.btnTestNextQuestion.addEventListener("click", () => {
            currentQuestionIndex++;
            if (currentQuestionIndex < activeTestQuestions.length) {
                renderExamQuestionActive();
            } else {
                // Return to first question
                currentQuestionIndex = 0;
                renderExamQuestionActive();
            }
        });

        DOMElements.btnTestSubmitExam.addEventListener("click", submitActivePracticeExam);
    }

    async function startTimedPracticeExam(subject) {
        const standardSubjects = ["Physics", "Math", "Chemistry", "Mixed"];
        
        activeTest = {
            subject: subject === "Mixed" ? "Full Syllabus" : subject,
            startTime: new Date().toLocaleTimeString()
        };

        // Reset tracking vars
        currentQuestionIndex = 0;
        testSecondsElapsed = 0;
        testAnswers = {};

        if (!standardSubjects.includes(subject)) {
            // Show loading modal overlay
            DOMElements.examGenerationOverlay.classList.add("active");
            DOMElements.examGenerationStatusText.innerText = `Connecting to local Ollama server to synthesize custom exam questions for "${subject}"...`;
            
            try {
                // Wait for async generator
                activeTestQuestions = await AI.getCustomQuestions(subject, appState.user.targetExam || 'General');
            } catch (e) {
                console.warn(e);
            } finally {
                // Hide loading overlay
                DOMElements.examGenerationOverlay.classList.remove("active");
            }
        } else {
            activeTestQuestions = AI.diagnosticQuestions.filter(q => subject === "Mixed" || q.subject === subject);
            if (activeTestQuestions.length === 0) {
                activeTestQuestions = AI.diagnosticQuestions;
            }
        }
        
        // Show panel
        DOMElements.testStartPrompt.style.display = "none";
        DOMElements.testRunningPanel.style.display = "block";
        
        DOMElements.testTopicHeader.innerText = `${activeTest.subject} Practice Mock`;

        // Start timer
        if (testTimerInterval) clearInterval(testTimerInterval);
        testTimerInterval = setInterval(() => {
            testSecondsElapsed++;
            const mins = String(Math.floor(testSecondsElapsed / 60)).padStart(2, '0');
            const secs = String(testSecondsElapsed % 60).padStart(2, '0');
            DOMElements.testTimeTracker.innerText = `Time: ${mins}:${secs}`;
        }, 1000);

        renderExamQuestionActive();
    }

    function renderExamQuestionActive() {
        const q = activeTestQuestions[currentQuestionIndex];
        
        DOMElements.testQuestionCounter.innerText = `Question ${currentQuestionIndex + 1} of ${activeTestQuestions.length}`;
        DOMElements.testActiveQuestionText.innerText = q.question;
        
        const grid = DOMElements.testActiveOptionsGrid;
        grid.innerHTML = "";

        q.options.forEach((opt, idx) => {
            const activeSel = testAnswers[q.id] !== undefined && parseInt(testAnswers[q.id]) === idx;
            
            const div = document.createElement("div");
            div.className = `diag-option-row ${activeSel ? 'selected' : ''}`;
            div.innerHTML = `
                <div class="diag-option-bullet">${String.fromCharCode(65 + idx)}</div>
                <span style="font-size: 13px;">${opt}</span>
            `;
            
            div.addEventListener("click", () => {
                testAnswers[q.id] = idx;
                
                // Redraw option selection highlights
                grid.querySelectorAll(".diag-option-row").forEach(r => r.classList.remove("selected"));
                div.classList.add("selected");
            });

            grid.appendChild(div);
        });
    }

    function submitActivePracticeExam() {
        if (!confirm("Are you sure you want to submit your mock test answers for analysis?")) {
            return;
        }

        clearInterval(testTimerInterval);
        
        // Evaluate score
        let correctAnswersCount = 0;
        activeTestQuestions.forEach(q => {
            if (testAnswers[q.id] !== undefined && parseInt(testAnswers[q.id]) === q.answer) {
                correctAnswersCount++;
            }
        });

        const acc = activeTestQuestions.length > 0 ? Math.round((correctAnswersCount / activeTestQuestions.length) * 100) : 0;
        
        // Add to state store
        Store.addTestResult({
            score: correctAnswersCount,
            totalQuestions: activeTestQuestions.length,
            accuracy: acc,
            topic: activeTest.subject,
            timeSpent: DOMElements.testTimeTracker.innerText.replace('Time: ', '')
        });

        // Complete & toggle UI views
        DOMElements.testRunningPanel.style.display = "none";
        DOMElements.testStartPrompt.style.display = "block";
        
        alert(`Assessment Evaluated! Score: ${correctAnswersCount}/${activeTestQuestions.length} (${acc}%) successfully recorded in your Progress Graph!`);
    }

    function renderTestHistoryLogs() {
        const box = DOMElements.testHistoryLogsBox;
        box.innerHTML = "";
        
        const placeholder = DOMElements.perfMockStatsPlaceholder;

        if (appState.tests.length === 0) {
            placeholder.style.display = "block";
            DOMElements.perfMockStatsContainer.style.display = "none";
            return;
        }

        placeholder.style.display = "none";
        DOMElements.perfMockStatsContainer.style.display = "block";

        appState.tests.slice().reverse().forEach(test => {
            const row = document.createElement("div");
            row.style.background = "rgba(255,255,255,0.02)";
            row.style.border = "1px solid rgba(255,255,255,0.05)";
            row.style.borderRadius = "10px";
            row.style.padding = "10px 14px";
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            
            row.innerHTML = `
                <div>
                    <div style="font-weight:700; font-size:13px;">${test.topic} Exam</div>
                    <div style="font-size:10px; color:var(--text-muted);">${test.date} • Duration: ${test.timeSpent}</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:800; color:var(--color-primary); font-size:14px;">${test.accuracy}%</div>
                    <span class="badge ${test.accuracy >= 75 ? 'badge-success' : 'badge-warning'}" style="font-size:9px; padding:2px 6px;">
                        ${test.score}/${test.totalQuestions} Right
                    </span>
                </div>
            `;
            box.appendChild(row);
        });
    }

    // ==========================================
    // MODULE 5: MENTAL WELLNESS
    // ==========================================
    function setupWellnessListeners() {
        // Range slider text updates
        DOMElements.wellnessStressSlider.addEventListener("input", (e) => {
            DOMElements.stressSliderValue.innerText = `${e.target.value} / 10`;
        });

        DOMElements.wellnessSleepSlider.addEventListener("input", (e) => {
            DOMElements.sleepSliderValue.innerText = `${e.target.value} Hours`;
        });

        // Mood select click highlights
        DOMElements.moodCards.forEach(card => {
            card.addEventListener("click", () => {
                DOMElements.moodCards.forEach(c => c.classList.remove("selected"));
                card.classList.add("selected");
            });
        });

        // Log Submit
        DOMElements.wellnessForm.addEventListener("submit", (e) => {
            e.preventDefault();
            
            const activeMoodCard = document.querySelector(".mood-card.selected");
            const mood = activeMoodCard ? activeMoodCard.getAttribute("data-mood") : "Balanced";
            const stress = parseInt(DOMElements.wellnessStressSlider.value);
            const sleep = parseFloat(DOMElements.wellnessSleepSlider.value);
            const notes = DOMElements.wellnessNotes.value.trim();

            // Save log
            Store.addMoodLog({ mood, stressScore: stress, sleepQuality: sleep, notes });
            DOMElements.wellnessNotes.value = "";

            // Run analysis
            const feedback = AI.evaluateWellness(mood, stress, sleep);
            
            // Show helpline block if critical stress
            if (feedback.helplineNeeded) {
                DOMElements.wellnessHelplineBanner.style.display = "block";
                // Speak support
                AI.speak("Hey, we detected high stress levels today. Please take a moment for yourself. You are doing great, grades do not define you.");
            } else {
                DOMElements.wellnessHelplineBanner.style.display = "none";
            }

            // Output feedback card text
            DOMElements.wellnessSuggestionPanelText.innerHTML = `
                <strong style="color:var(--color-primary); display:block; margin-bottom:6px;">Status: ${feedback.level}</strong>
                <p style="margin-bottom:8px; line-height:1.4;">${feedback.message}</p>
                <ul style="padding-left:15px; margin-top:8px;">
                    ${feedback.tips.map(t => `<li style="margin-bottom:4px;">${t}</li>`).join('')}
                </ul>
            `;
            
            alert("Self-care mood check logged! 15 XP tokens awarded.");
        });

        DOMElements.btnDismissHelplineBanner.addEventListener("click", () => {
            DOMElements.wellnessHelplineBanner.style.display = "none";
        });

        // Box Breathing Simulator Trigger
        DOMElements.btnTriggerBreathingSimulator.addEventListener("click", () => {
            if (breathingInterval) {
                // Stop breathing cycle
                clearInterval(breathingInterval);
                breathingInterval = null;
                DOMElements.btnTriggerBreathingSimulator.innerText = "Start Box Breathe";
                DOMElements.btnTriggerBreathingSimulator.classList.remove("active");
                DOMElements.breathWidgetBox.className = "breathing-box";
                DOMElements.breathBubbleText.innerText = "Focus";
                DOMElements.breathTimerFill.style.width = "0%";
            } else {
                // Start breathing cycle
                DOMElements.btnTriggerBreathingSimulator.innerText = "Stop Breathe";
                DOMElements.btnTriggerBreathingSimulator.classList.add("active");
                
                breathingCycleIndex = 0;
                runBoxBreathingCycle();
                
                breathingInterval = setInterval(() => {
                    breathingCycleIndex = (breathingCycleIndex + 1) % 4;
                    runBoxBreathingCycle();
                }, 4000);
            }
        });
    }

    function runBoxBreathingCycle() {
        const box = DOMElements.breathWidgetBox;
        const text = DOMElements.breathBubbleText;
        const fill = DOMElements.breathTimerFill;

        box.className = "breathing-box";
        fill.style.transition = "none";
        fill.style.width = "0%";

        setTimeout(() => {
            fill.style.transition = "width 4s linear";
            fill.style.width = "100%";
        }, 50);

        if (breathingCycleIndex === 0) {
            box.classList.add("inhale");
            text.innerText = "Inhale...";
        } else if (breathingCycleIndex === 1) {
            box.classList.add("hold");
            text.innerText = "Hold...";
        } else if (breathingCycleIndex === 2) {
            box.classList.add("exhale");
            text.innerText = "Exhale...";
        } else if (breathingCycleIndex === 3) {
            box.classList.add("hold");
            text.innerText = "Rest...";
        }
    }

    // ==========================================
    // MODULE 6: BILLING & CAREERS
    // ==========================================
    function setupBillingListeners() {
        // Upgrade premium modal popup
        DOMElements.btnTriggerMockCheckout.addEventListener("click", async () => {
            DOMElements.checkoutModalOverlay.classList.add("active");
            
            const ownerUpi = localStorage.getItem("YOUR_AI_PARTNER_OWNER_UPI") || "ajeetkumar8877274374-1@okicici";
            const ownerName = localStorage.getItem("YOUR_AI_PARTNER_OWNER_NAME") || "Ajeetroy_1";
            
            // Check if Stripe configuration is active
            let hasStripe = false;
            try {
                const res = await fetch('/api/create-checkout-session', { method: 'POST' });
                if (res.ok) {
                    const data = await res.json();
                    hasStripe = data.success || !data.mock_mode;
                }
            } catch (e) {
                console.warn("Stripe check failed, defaulting to mock/UPI:", e);
            }
            
            const prodEl = document.getElementById("stripeProductionOption");
            const mockEl = document.getElementById("stripeMockOption");
            
            if (hasStripe) {
                if (prodEl) prodEl.style.display = "block";
                if (mockEl) mockEl.style.display = "none";
                DOMElements.btnSubmitMockCheckout.innerText = "Proceed to Secure Pay 🔒";
            } else {
                if (prodEl) prodEl.style.display = "none";
                if (mockEl) mockEl.style.display = "block";
                
                if (ownerUpi) {
                    // Owner UPI configuration mode: Display dynamic Scan & Pay QR code
                    DOMElements.checkoutMockTitle.innerText = "Secure UPI Scan & Pay";
                    DOMElements.checkoutSimulatedDescContainer.style.display = "none";
                    DOMElements.checkoutRealUpiContainer.style.display = "block";
                    DOMElements.checkoutUpiPayeeName.innerText = ownerName;
                    DOMElements.checkoutUpiId.innerText = ownerUpi;
                    
                    // Generate dynamic UPI payload URI
                    const upiUri = `upi://pay?pa=${ownerUpi}&pn=${encodeURIComponent(ownerName)}&am=49.00&cu=INR&tn=YourAIPartnerPremium`;
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUri)}`;
                    DOMElements.checkoutUpiQrImage.src = qrUrl;
                    
                    DOMElements.btnSubmitMockCheckout.innerText = "Submit Payment Proof ✅";
                } else {
                    // Standard simulated gateway mode
                    DOMElements.checkoutMockTitle.innerText = "Development Simulated Gateway";
                    DOMElements.checkoutSimulatedDescContainer.style.display = "block";
                    DOMElements.checkoutRealUpiContainer.style.display = "none";
                    DOMElements.btnSubmitMockCheckout.innerText = "Simulate Payment ✅";
                }
            }
        });

        DOMElements.btnCancelCheckout.addEventListener("click", () => {
            DOMElements.checkoutModalOverlay.classList.remove("active");
        });

        // Submit checkout (Redirect to Stripe or Fallback to Simulator/UPI verification)
        DOMElements.btnSubmitMockCheckout.addEventListener("click", async () => {
            const btn = DOMElements.btnSubmitMockCheckout;
            const originalText = btn.innerText;
            
            const mockEl = document.getElementById("stripeMockOption");
            const isMock = mockEl && mockEl.style.display !== "none";
            
            if (!isMock) {
                btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Contacting Stripe...';
                btn.disabled = true;
                
                try {
                    const res = await fetch('/api/create-checkout-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.url) {
                            window.location.href = data.url;
                            return;
                        }
                    }
                } catch (e) {
                    console.warn("Stripe checkout redirect failed, defaulting to simulator:", e);
                }
                
                btn.innerText = originalText;
                btn.disabled = false;
            }
            
            // Check if Owner UPI Payment Proof Mode is active
            const ownerUpi = localStorage.getItem("YOUR_AI_PARTNER_OWNER_UPI") || "ajeetkumar8877274374-1@okicici";
            if (isMock && ownerUpi) {
                const trxId = DOMElements.checkoutUpiTrxInput.value.trim();
                const utrRegex = /^\d{12}$/;
                
                if (!utrRegex.test(trxId)) {
                    alert("⚠️ INVALID UTR: Please enter a valid 12-digit UPI transaction reference number (UTR) to submit payment proof!");
                    return;
                }
                
                // Store payment proof UTR inside profile skills JSON dictionary securely
                if (!Store.state.user.skills) Store.state.user.skills = {};
                Store.state.user.skills.paymentTrxId = trxId;
            }
            
            // Safe simulated/UPI success flow
            const payType = (DOMElements.mockCheckoutPaymentType && DOMElements.mockCheckoutPaymentType.value)
                ? DOMElements.mockCheckoutPaymentType.value.toUpperCase()
                : "REAL_UPI";
                
            DOMElements.checkoutModalOverlay.classList.remove("active");
            
            // Apply premium upgrades locally
            Store.state.user.premium = true;
            Store.unlockBadge('Elite Thinker');
            Store.addXP(200);
            Store.saveState();
            
            // Sync the updated premium status & payment proof UTR reference to SQLite
            if (Store.saveProfileToDatabase) {
                await Store.saveProfileToDatabase();
            }
            
            if (isMock && ownerUpi) {
                const trxId = DOMElements.checkoutUpiTrxInput.value.trim();
                DOMElements.checkoutUpiTrxInput.value = ""; // Clear input
                alert(`🎉 SUCCESS: Payment proof [UTR: ${trxId}] submitted! Your account has been verified and upgraded to Lifetime Premium membership + 200 XP unlocked!`);
            } else {
                alert(`Payment Simulator Success! Method: [${payType}]. Account upgraded to Premium + 200 XP unlocked!`);
            }
        });

        // Scholarship modal triggers
        DOMElements.btnTriggerScholarshipModal.addEventListener("click", (e) => {
            e.preventDefault();
            DOMElements.scholarshipModalOverlay.classList.add("active");
        });

        DOMElements.btnCancelScholarship.addEventListener("click", () => {
            DOMElements.scholarshipModalOverlay.classList.remove("active");
        });

        DOMElements.scholarshipForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const reason = DOMElements.scholarshipReasonInput.value.trim();
            
            if (reason) {
                DOMElements.scholarshipModalOverlay.classList.remove("active");
                DOMElements.scholarshipReasonInput.value = "";
                alert("Scholarship Application Received! Our AI committee will review your waiver within 24 hours. A temporary Premium grant has been approved!");
                Store.unlockBadge('Scholarship Recipient');
                Store.addXP(50);
            }
        });

        // Career generation triggers
        DOMElements.btnGenerateCareerRoadmap.addEventListener("click", () => {
            const goal = DOMElements.careerPathSelector.value;
            generateAndRenderCareerRoadmap(goal);
        });
    }

    function generateAndRenderCareerRoadmap(pathKey) {
        const roadmap = AI.generateCareerRoadmap(pathKey);
        
        DOMElements.careerRoadmapTitle.innerText = roadmap.title;
        DOMElements.careerRoadmapDesc.innerText = `${roadmap.description}\n🌟 Skills: [${roadmap.skills.join(', ')}]\n🎓 Certs: ${roadmap.certifications}`;
        
        const list = DOMElements.careerRoadmapStepsList;
        list.innerHTML = "";

        roadmap.steps.forEach((step, idx) => {
            const div = document.createElement("div");
            div.style.background = "rgba(255,255,255,0.02)";
            div.style.borderRadius = "8px";
            div.style.padding = "10px 14px";
            div.style.borderLeft = "3px solid var(--color-primary)";
            div.innerHTML = `
                <div style="font-weight:700; font-size:13px; color:var(--text-main);">${idx + 1}. ${step.title}</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${step.desc}</div>
            `;
            list.appendChild(div);
        });
    }

    // ==========================================
    // UTILS & METRIC RENDERERS
    // ==========================================
    function renderUnlockedBadges(badges) {
        const container = DOMElements.unlockedBadgesGallery;
        container.innerHTML = "";

        // Available visual achievements config mapping
        const badgeDetails = {
            'Welcome Explorer': { icon: 'fa-compass', color: 'badge-cyan', desc: 'Signed up on Your AI Partner' },
            'Strategic Starter': { icon: 'fa-chess-rook', color: 'badge-purple', desc: 'Onboarding diagnostic evaluated' },
            'Consistent Comrade': { icon: 'fa-fire', color: 'badge-pink', desc: 'Unlocked day study streak activity' },
            'Elite Thinker': { icon: 'fa-gem', color: 'badge-cyan', desc: 'Upgraded to premium membership series' },
            'Scholarship Recipient': { icon: 'fa-graduation-cap', color: 'badge-purple', desc: 'Financial tuition waiver approved' },
            'Streak Master (7 Days)': { icon: 'fa-bolt', color: 'badge-pink', desc: 'Maintained 7 days consecutive focus' },
            'Unstoppable Sage (30 Days)': { icon: 'fa-crown', color: 'badge-warning', desc: '30 Days persistent study streak!' },
            'Level 2 Achiever': { icon: 'fa-angles-up', color: 'badge-success', desc: 'Passed level threshold boundaries' },
            'Level 3 Achiever': { icon: 'fa-angles-up', color: 'badge-success', desc: 'Passed level 3 threshold limits' },
            'First Step Taken': { icon: 'fa-shoe-prints', color: 'badge-success', desc: 'Completed first 1-hour study task block' },
            'Deep Focus Disciple': { icon: 'fa-dharmachakra', color: 'badge-success', desc: 'Completed 10 cumulative study hours' },
            'Scholarly Giant': { icon: 'fa-book-open', color: 'badge-success', desc: 'Mastered 50 cumulative study hours' },
            'Fearless Examiner': { icon: 'fa-stopwatch', color: 'badge-warning', desc: 'Finished first simulated practice exam' },
            'Analytical Alchemist': { icon: 'fa-chart-pie', color: 'badge-warning', desc: 'Finished 5 adaptive mock evaluations' }
        };

        badges.forEach(b => {
            const bMeta = badgeDetails[b] || { icon: 'fa-medal', color: 'badge-cyan', desc: 'Achieved academic milestones' };
            const div = document.createElement("div");
            div.className = "achievement-badge-card";
            div.innerHTML = `
                <div class="badge-icon-box ${bMeta.color}">
                    <i class="fa-solid ${bMeta.icon}"></i>
                </div>
                <div>
                    <div class="badge-title">${b}</div>
                    <div class="badge-desc">${bMeta.desc}</div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    // ==========================================
    // MODULE 7: AI MENTOR VIDEO CALL SIMULATOR
    // ==========================================
    function setupVideoCallListeners() {
        DOMElements.btnStartVideoCallSimulator.addEventListener("click", () => {
            startVideoCallSession();
        });

        DOMElements.btnVideoCallEndCall.addEventListener("click", () => {
            endVideoCallSession();
        });

        // Toggle Microphone button
        DOMElements.btnVideoCallToggleMic.addEventListener("click", () => {
            videoCallIsMicMuted = !videoCallIsMicMuted;
            if (videoCallStream) {
                videoCallStream.getAudioTracks().forEach(track => {
                    track.enabled = !videoCallIsMicMuted;
                });
            }
            if (videoCallIsMicMuted) {
                DOMElements.btnVideoCallToggleMic.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
                DOMElements.btnVideoCallToggleMic.style.borderColor = "var(--color-danger)";
                DOMElements.btnVideoCallToggleMic.style.color = "var(--color-danger)";
                DOMElements.aiMentorCallStatusText.innerText = "Microphone muted";
            } else {
                DOMElements.btnVideoCallToggleMic.innerHTML = '<i class="fa-solid fa-microphone"></i>';
                DOMElements.btnVideoCallToggleMic.style.borderColor = "";
                DOMElements.btnVideoCallToggleMic.style.color = "";
                DOMElements.aiMentorCallStatusText.innerText = "AI Mentor listening...";
            }
        });

        // Toggle Camera button
        DOMElements.btnVideoCallToggleCam.addEventListener("click", () => {
            videoCallIsCamOff = !videoCallIsCamOff;
            if (videoCallStream) {
                videoCallStream.getVideoTracks().forEach(track => {
                    track.enabled = !videoCallIsCamOff;
                });
            }
            if (videoCallIsCamOff) {
                DOMElements.btnVideoCallToggleCam.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
                DOMElements.btnVideoCallToggleCam.style.borderColor = "var(--color-danger)";
                DOMElements.btnVideoCallToggleCam.style.color = "var(--color-danger)";
                DOMElements.videoCallLocalVideo.style.display = "none";
                DOMElements.studentCallPlaceholder.style.display = "flex";
                DOMElements.studentCallPlaceholder.innerText = (appState.user.name || "U").charAt(0).toUpperCase();
            } else {
                DOMElements.btnVideoCallToggleCam.innerHTML = '<i class="fa-solid fa-video"></i>';
                DOMElements.btnVideoCallToggleCam.style.borderColor = "";
                DOMElements.btnVideoCallToggleCam.style.color = "";
                DOMElements.videoCallLocalVideo.style.display = "block";
                DOMElements.studentCallPlaceholder.style.display = "none";
            }
        });
    }

    function startVideoCallSession() {
        videoCallTimeLeft = 3600; // Reset to 1 Hour
        videoCallIsMicMuted = false;
        videoCallIsCamOff = false;

        // Display overlay modal
        DOMElements.videoCallOverlay.classList.add("active");

        // Format and render timer
        updateVideoCallTimerDisplay();
        videoCallTimerInterval = setInterval(() => {
            videoCallTimeLeft--;
            updateVideoCallTimerDisplay();
            if (videoCallTimeLeft <= 0) {
                endVideoCallSession();
                alert("Your 1-hour coaching session test has concluded! Great job!");
            }
        }, 1000);

        // Start equalizers animation
        startEqualizerAnimation();

        // Trigger Speech synthesis welcome speech
        const welcome = `Hello ${appState.user.name}! Welcome to your one-hour live mentorship coaching session. I am your personal success teacher. Feel free to speak anytime and ask me questions about your target exam ${appState.user.targetExam}!`;
        DOMElements.videoCallSubtitleText.innerText = `AI: "${welcome}"`;
        AI.speak(welcome);

        // Access student camera and mic
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                .then(stream => {
                    videoCallStream = stream;
                    DOMElements.videoCallLocalVideo.srcObject = stream;
                    DOMElements.videoCallLocalVideo.style.display = "block";
                    DOMElements.studentCallPlaceholder.style.display = "none";
                })
                .catch(err => {
                    console.warn("Camera/Mic access denied or unavailable: ", err);
                    DOMElements.videoCallLocalVideo.style.display = "none";
                    DOMElements.studentCallPlaceholder.style.display = "flex";
                    DOMElements.studentCallPlaceholder.innerText = (appState.user.name || "U").charAt(0).toUpperCase();
                });
        }

        // Initialize Speech Recognition for continuous listening during call
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            videoCallSpeechRecognition = new SpeechRecognition();
            videoCallSpeechRecognition.continuous = true;
            videoCallSpeechRecognition.interimResults = false;
            videoCallSpeechRecognition.lang = 'en-US';

            videoCallSpeechRecognition.onresult = (event) => {
                const speechResult = event.results[event.results.length - 1][0].transcript.trim();
                if (!speechResult || videoCallIsMicMuted) return;

                DOMElements.videoCallSubtitleText.innerText = `You: "${speechResult}"`;
                DOMElements.aiMentorCallStatusText.innerText = "AI thinking...";

                // Get dynamic response
                (async () => {
                    if (videoCallTimeLeft <= 0) return;
                    try {
                        const response = await AI.getTutorResponse(speechResult, 'general', 'intermediate', 'English');
                        const cleanResponse = response.replace(/[\*\`💡📋📐⚠️]/g, '');
                        
                        DOMElements.videoCallSubtitleText.innerText = `AI: "${cleanResponse}"`;
                        DOMElements.aiMentorCallStatusText.innerText = "AI speaking...";
                        
                        AI.speak(cleanResponse);
                        
                        // Award XP tokens!
                        Store.addXP(15);
                    } catch (err) {
                        console.error("Video call AI response failed: ", err);
                    }
                })();
            };

            videoCallSpeechRecognition.onerror = (e) => {
                console.warn("Call speech recognition error: ", e);
            };

            videoCallSpeechRecognition.onend = () => {
                // Keep listening if call is still active
                if (DOMElements.videoCallOverlay.classList.contains("active") && videoCallSpeechRecognition) {
                    try { videoCallSpeechRecognition.start(); } catch(e) {}
                }
            };

            try {
                videoCallSpeechRecognition.start();
            } catch(e) {}
        }
    }

    function updateVideoCallTimerDisplay() {
        const hours = Math.floor(videoCallTimeLeft / 3600);
        const mins = Math.floor((videoCallTimeLeft % 3600) / 60);
        const secs = videoCallTimeLeft % 60;
        
        let display = "";
        if (hours > 0) {
            display += String(hours).padStart(2, '0') + ":";
        }
        display += String(mins).padStart(2, '0') + ":" + String(secs).padStart(2, '0');
        
        DOMElements.videoCallTimerText.innerText = display;
    }

    function startEqualizerAnimation() {
        const bars = DOMElements.aiVoiceWaveBars.querySelectorAll("div");
        if (videoCallEqualizerInterval) clearInterval(videoCallEqualizerInterval);
        
        videoCallEqualizerInterval = setInterval(() => {
            const speaking = window.speechSynthesis && window.speechSynthesis.speaking;
            bars.forEach(bar => {
                const min = speaking ? 15 : 4;
                const max = speaking ? 45 : 12;
                const randHeight = Math.floor(Math.random() * (max - min + 1)) + min;
                bar.style.height = `${randHeight}px`;
            });
            if (speaking) {
                DOMElements.aiMentorCallStatusText.innerText = "AI Speaking...";
            } else if (!videoCallIsMicMuted) {
                DOMElements.aiMentorCallStatusText.innerText = "AI Mentor listening...";
            }
        }, 120);
    }

    function endVideoCallSession() {
        // Stop camera streams
        if (videoCallStream) {
            videoCallStream.getTracks().forEach(track => track.stop());
            videoCallStream = null;
        }

        // Clear intervals
        if (videoCallTimerInterval) clearInterval(videoCallTimerInterval);
        if (videoCallEqualizerInterval) clearInterval(videoCallEqualizerInterval);
        
        // Stop speech recognition
        if (videoCallSpeechRecognition) {
            videoCallSpeechRecognition.onend = null;
            try { videoCallSpeechRecognition.stop(); } catch(e) {}
            videoCallSpeechRecognition = null;
        }

        // Stop current speech output
        AI.stopSpeaking();

        // Close overlay modal
        DOMElements.videoCallOverlay.classList.remove("active");
        
        // Toggle mic/cam icon resets
        DOMElements.btnVideoCallToggleMic.innerHTML = '<i class="fa-solid fa-microphone"></i>';
        DOMElements.btnVideoCallToggleMic.style.borderColor = "";
        DOMElements.btnVideoCallToggleMic.style.color = "";
        
        DOMElements.btnVideoCallToggleCam.innerHTML = '<i class="fa-solid fa-video"></i>';
        DOMElements.btnVideoCallToggleCam.style.borderColor = "";
        DOMElements.btnVideoCallToggleCam.style.color = "";
    }

    // --- Ollama Server Live Status Checks ---
    let ollamaStatusInterval = null;
    
    async function checkOllamaServerStatus() {
        const provider = localStorage.getItem("YOUR_AI_PARTNER_API_PROVIDER") || "cloud_gemini";
        if (provider === "cloud_gemini") {
            DOMElements.ollamaStatusBadge.style.background = "rgba(16, 185, 129, 0.15)";
            DOMElements.ollamaStatusBadge.style.color = "var(--color-success)";
            DOMElements.ollamaStatusBadge.style.borderColor = "var(--color-success)";
            DOMElements.ollamaStatusBadge.innerHTML = '<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--color-success);"></span> Cloud Active';
            DOMElements.ollamaModelName.innerText = "Gemini 2.5 Flash ⚡";
            
            if (DOMElements.settingsOllamaStatus) {
                DOMElements.settingsOllamaStatus.innerText = "Cloud Active";
                DOMElements.settingsOllamaStatus.style.color = "var(--color-success)";
            }
            return;
        }

        try {
            const res = await fetch('/api/ollama/status');
            if (res.ok) {
                const data = await res.json();
                if (data.status === 'online') {
                    // Update Sidebar Badge
                    DOMElements.ollamaStatusBadge.style.background = "rgba(16, 185, 129, 0.15)";
                    DOMElements.ollamaStatusBadge.style.color = "var(--color-success)";
                    DOMElements.ollamaStatusBadge.style.borderColor = "var(--color-success)";
                    DOMElements.ollamaStatusBadge.innerHTML = '<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--color-success);" id="ollamaStatusDot"></span> Online';
                    
                    // Update Active Model Name
                    const activeModel = Store.state.selectedModel || 'gemma3:1b';
                    DOMElements.ollamaModelName.innerText = activeModel;
                    
                    // Update Settings Form status
                    if (DOMElements.settingsOllamaStatus) {
                        DOMElements.settingsOllamaStatus.innerText = "Online";
                        DOMElements.settingsOllamaStatus.style.color = "var(--color-success)";
                    }
                    
                    // Populate models selection if empty or just default options
                    if (data.models && data.models.length > 0 && DOMElements.settingsOllamaModelSelect) {
                        const prevValue = DOMElements.settingsOllamaModelSelect.value;
                        DOMElements.settingsOllamaModelSelect.innerHTML = "";
                        data.models.forEach(model => {
                            const opt = document.createElement("option");
                            opt.value = model;
                            opt.innerText = model;
                            DOMElements.settingsOllamaModelSelect.appendChild(opt);
                        });
                        
                        const customOpt = document.createElement("option");
                        customOpt.value = "Custom";
                        customOpt.innerText = "-- Custom Model --";
                        DOMElements.settingsOllamaModelSelect.appendChild(customOpt);
                        
                        if (data.models.includes(prevValue) || prevValue === "Custom") {
                            DOMElements.settingsOllamaModelSelect.value = prevValue;
                        } else {
                            DOMElements.settingsOllamaModelSelect.value = data.models[0];
                            Store.state.selectedModel = data.models[0];
                        }
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn("Ollama check failed: ", e);
        }
        
        // Offline / Failed State
        DOMElements.ollamaStatusBadge.style.background = "rgba(244, 63, 94, 0.15)";
        DOMElements.ollamaStatusBadge.style.color = "var(--color-danger)";
        DOMElements.ollamaStatusBadge.style.borderColor = "var(--color-danger)";
        DOMElements.ollamaStatusBadge.innerHTML = '<span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--color-danger);" id="ollamaStatusDot"></span> Offline';
        
        DOMElements.ollamaModelName.innerText = "Simulated Fallback";
        
        if (DOMElements.settingsOllamaStatus) {
            DOMElements.settingsOllamaStatus.innerText = "Offline";
            DOMElements.settingsOllamaStatus.style.color = "var(--color-danger)";
        }
    }

    function updateDbSyncIndicator() {
        const status = Store.syncStatus || 'offline';
        if (status === 'synced') {
            DOMElements.dbSyncText.innerHTML = '<i class="fa-solid fa-circle-check" style="color: var(--color-success);"></i> Synced';
            DOMElements.dbSyncText.style.color = "var(--color-success)";
        } else if (status === 'syncing') {
            DOMElements.dbSyncText.innerHTML = '<i class="fa-solid fa-arrows-rotate fa-spin" style="color: var(--color-primary);"></i> Saving...';
            DOMElements.dbSyncText.style.color = "var(--color-primary)";
        } else if (status === 'error') {
            DOMElements.dbSyncText.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color: var(--color-danger);"></i> Sync Error';
            DOMElements.dbSyncText.style.color = "var(--color-danger)";
        } else {
            DOMElements.dbSyncText.innerHTML = '<i class="fa-solid fa-cloud-arrow-up" style="color: var(--text-muted);"></i> Offline Cache';
            DOMElements.dbSyncText.style.color = "var(--text-muted)";
        }
    }

    // ==========================================
    // MODULE 7: OLLAMA SERVER SETTINGS
    // ==========================================
    function setupServerSettingsListeners() {
        DOMElements.settingsAiLocationSelect.addEventListener("change", (e) => {
            if (e.target.value === "cloud_gemini") {
                DOMElements.geminiKeyGroup.style.display = "block";
                DOMElements.ollamaModelGroup.style.display = "none";
            } else {
                DOMElements.geminiKeyGroup.style.display = "none";
                DOMElements.ollamaModelGroup.style.display = "block";
            }
        });

        DOMElements.settingsOllamaModelSelect.addEventListener("change", (e) => {
            if (e.target.value === "Custom") {
                DOMElements.settingsCustomModelInput.style.display = "block";
                DOMElements.settingsCustomModelInput.focus();
            } else {
                DOMElements.settingsCustomModelInput.style.display = "none";
                DOMElements.settingsCustomModelInput.value = "";
            }
        });

        DOMElements.btnOpenServerSettings.addEventListener("click", () => {
            const provider = localStorage.getItem("YOUR_AI_PARTNER_API_PROVIDER") || "cloud_gemini";
            const geminiKey = localStorage.getItem("YOUR_AI_PARTNER_GEMINI_KEY") || "AIzaSyDMT4LPz0XZCBq2lvp60B6shDXFg1rM0mU";
            const ownerUpi = localStorage.getItem("YOUR_AI_PARTNER_OWNER_UPI") || "ajeetkumar8877274374-1@okicici";
            const ownerName = localStorage.getItem("YOUR_AI_PARTNER_OWNER_NAME") || "Ajeetroy_1";
            
            DOMElements.settingsAiLocationSelect.value = provider;
            DOMElements.settingsGeminiKeyInput.value = geminiKey;
            DOMElements.settingsOwnerUpiIdInput.value = ownerUpi;
            DOMElements.settingsOwnerPayeeNameInput.value = ownerName;
            
            if (provider === "cloud_gemini") {
                DOMElements.geminiKeyGroup.style.display = "block";
                DOMElements.ollamaModelGroup.style.display = "none";
            } else {
                DOMElements.geminiKeyGroup.style.display = "none";
                DOMElements.ollamaModelGroup.style.display = "block";
            }

            const activeModel = Store.state.selectedModel || 'gemma3:1b';
            const exists = Array.from(DOMElements.settingsOllamaModelSelect.options)
                .some(opt => opt.value === activeModel);
                
            if (exists) {
                DOMElements.settingsOllamaModelSelect.value = activeModel;
                DOMElements.settingsCustomModelInput.style.display = "none";
                DOMElements.settingsCustomModelInput.value = "";
            } else {
                DOMElements.settingsOllamaModelSelect.value = "Custom";
                DOMElements.settingsCustomModelInput.value = activeModel;
                DOMElements.settingsCustomModelInput.style.display = "block";
            }
            
            checkOllamaServerStatus();
            DOMElements.aiSettingsModalOverlay.classList.add("active");
        });

        DOMElements.btnCancelAiSettings.addEventListener("click", () => {
            DOMElements.aiSettingsModalOverlay.classList.remove("active");
        });

        DOMElements.aiSettingsForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const provider = DOMElements.settingsAiLocationSelect.value;
            const geminiKey = DOMElements.settingsGeminiKeyInput.value.trim();
            const ownerUpi = DOMElements.settingsOwnerUpiIdInput.value.trim();
            const ownerName = DOMElements.settingsOwnerPayeeNameInput.value.trim();
            
            localStorage.setItem("YOUR_AI_PARTNER_OWNER_UPI", ownerUpi);
            localStorage.setItem("YOUR_AI_PARTNER_OWNER_NAME", ownerName);
            
            if (provider === "cloud_gemini") {
                if (!geminiKey) {
                    alert("Please enter your Gemini API Key to enable cloud processing!");
                    return;
                }
                localStorage.setItem("YOUR_AI_PARTNER_API_PROVIDER", "cloud_gemini");
                localStorage.setItem("YOUR_AI_PARTNER_GEMINI_KEY", geminiKey);
                
                DOMElements.aiSettingsModalOverlay.classList.remove("active");
                alert("Cloud AI Provider and UPI settings configured successfully! Active Model: [Gemini 2.5 Flash] (Zero Mac Heat! ⚡)");
                checkOllamaServerStatus();
                return;
            }
            
            localStorage.setItem("YOUR_AI_PARTNER_API_PROVIDER", "local");
            const selectValue = DOMElements.settingsOllamaModelSelect.value;
            let modelName = selectValue;
            
            if (selectValue === "Custom") {
                modelName = DOMElements.settingsCustomModelInput.value.trim();
                if (!modelName) {
                    alert("Please enter a custom model name!");
                    return;
                }
            }
            
            Store.state.selectedModel = modelName;
            Store.saveState();
            
            DOMElements.aiSettingsModalOverlay.classList.remove("active");
            alert(`Local AI Model configured successfully! Active Model: [${modelName}]`);
            checkOllamaServerStatus();
        });

        DOMElements.btnRefreshServerStatus.addEventListener("click", async () => {
            DOMElements.settingsOllamaStatus.innerText = "Checking...";
            DOMElements.settingsOllamaStatus.style.color = "var(--text-muted)";
            await checkOllamaServerStatus();
        });

        DOMElements.btnWipeSqliteDb.addEventListener("click", () => {
            if (confirm("⚠️ WARNING: This will permanently wipe your persistent SQLite Database and reset the application state. Are you sure you want to proceed?")) {
                Store.resetState();
                DOMElements.aiSettingsModalOverlay.classList.remove("active");
                alert("Persistent SQLite database wiped successfully and state reset!");
                window.location.reload();
            }
        });
    }

    // Initialize core application orchestrator!
    init();
});
