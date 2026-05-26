// ai-service.js - Intelligent AI Simulation Layer
class AIService {
    constructor() {
        // Multi-language response datasets
        this.tutorResponses = {
            English: {
                beginner: {
                    physics: "Let's learn Physics! Think of **Gravity** like an invisible rubber band that pulls everything towards the center of the Earth. When you jump, the rubber band pulls you right back down. That is gravity! Without it, we would float away into space. Isn't that cool?",
                    math: "Let's learn Algebra! Imagine we are playing a detective game. A variable like **'x'** is a hidden treasure box. If I say `x + 3 = 10`, we want to find what is inside the box. If we take away the 3, we find that the box `x` must contain **7**! You just solved algebra!",
                    chemistry: "Let's learn Atoms! Everything you see - your phone, water, trees - is made of tiny building blocks called **atoms**. They are like LEGO bricks of the universe. When different bricks lock together, they form molecules, like how Hydrogen and Oxygen lock together to make water!",
                    general: "I'd love to explain! Let's start with the basics. Imagine this concept is like a story... [Select a specific topic or type a question to go deeper!]"
                },
                intermediate: {
                    physics: "Let's discuss **Gravity and Newton's Universal Law**. Gravity is an attractive force acting between any two bodies with mass. The force is directly proportional to the product of their masses and inversely proportional to the square of the distance between their centers: `F = G * (m1 * m2) / r^2`. That is why the moon orbits Earth and Earth orbits the sun!",
                    math: "In **Algebra (Linear Equations)**, our objective is to isolate the variable. For `2x + 5 = 15`, we subtract 5 from both sides to get `2x = 10`, then divide by 2 to find `x = 5`. The variable represents a value that satisfies the equality, charting a straight line on a graph.",
                    chemistry: "Let's explore **Atomic Structure**. An atom consists of a central dense nucleus containing protons (positive charge) and neutrons (neutral), surrounded by a cloud of electrons (negative charge) orbiting in defined energy levels or shells. The electron configuration governs how atoms bond.",
                    general: "Here is the structural explanation of this concept. It sits between simple analogies and formal proofs. Tell me which part we should elaborate on!"
                },
                advanced: {
                    physics: "Let's dive into **General Relativity & Spacetime Curvature**. Einstein postulated that gravity is not a traditional force, but rather a geometric consequence of mass-energy curving the four-dimensional fabric of Spacetime. The field equations `G_μν + Λg_μν = (8πG/c^4) T_μν` describe how matter tells spacetime how to curve, and curved spacetime tells matter how to move.",
                    math: "In **Advanced Algebra & Vector Spaces**, linear equations are viewed through the lens of linear transformations between vector spaces. Solving `Ax = b` involves analyzing the kernel (null space), column space, and row space of matrix A. If A is invertible, the solution is a unique mapping `x = A^-1 * b`.",
                    chemistry: "Let's analyze **Quantum Mechanical Atomic Model**. Rather than classical orbits, electrons reside in probability density clouds called wavefunctions, solved via the Schrödinger Equation: `Ĥψ = Eψ`. The shapes of s, p, d, and f orbitals represent regions where there is a >90% probability of locating an electron, governed by quantum numbers.",
                    general: "Here is the academic, formal breakdown. We will analyze the underlying mathematical formulas, proofs, and edge cases. What aspect shall we investigate?"
                }
            },
            Hindi: {
                beginner: {
                    physics: "आइये भौतिक विज्ञान सीखें! **गुरुत्वाकर्षण (Gravity)** को एक अदृश्य रबर बैंड की तरह समझें जो हर चीज को पृथ्वी के केंद्र की ओर खींचता है। जब आप कूदते हैं, तो वह रबर बैंड आपको वापस नीचे खींच लेता है। इसके बिना हम अंतरिक्ष में तैरने लगेंगे!",
                    math: "आइये बीजगणित (Algebra) सीखें! मान लें कि हम एक जासूसी खेल खेल रहे हैं। **'x'** एक गुप्त खजाना बॉक्स है। अगर मैं कहूं `x + 3 = 10`, तो हमें ढूंढना है कि बॉक्स में क्या है। यदि हम 3 को हटा दें, तो हमें पता चलता है कि बॉक्स `x` में **7** होना चाहिए!",
                    chemistry: "आइये परमाणु (Atoms) सीखें! आपके आस-पास की हर चीज़ - आपका फ़ोन, पानी, पेड़ - छोटे-छोटे ब्लॉकों से बनी है जिन्हें **परमाणु** कहते हैं। ये ब्रह्मांड के लेगो (LEGO) ब्लॉक्स की तरह हैं!",
                    general: "मुझे समझाने में खुशी होगी! आइए बिल्कुल बुनियादी स्तर से शुरू करें। इस अवधारणा को एक सरल कहानी की तरह समझें..."
                },
                intermediate: {
                    physics: "आइये **न्यूटन के गुरुत्वाकर्षण के नियम** पर चर्चा करें। गुरुत्वाकर्षण दो पिंडों के बीच लगने वाला एक आकर्षक बल है। यह बल उनके द्रव्यमान के गुणनफल के सीधे आनुपातिक और उनके केंद्रों के बीच की दूरी के वर्ग के व्युत्क्रमानुपातिक होता है: `F = G * (m1 * m2) / r^2`।",
                    math: "बीजगणित में, हमारा उद्देश्य चर (variable) को अलग करना है। `2x + 5 = 15` के लिए, हम दोनों पक्षों से 5 घटाकर `2x = 10` प्राप्त करते हैं, फिर 2 से विभाजित करके `x = 5` पाते हैं।",
                    chemistry: "आइये **परमाणु संरचना** को समझें। एक परमाणु में एक केंद्रीय सघन नाभिक (nucleus) होता है जिसमें प्रोटॉन (धनावेश) और न्यूट्रॉन (उदासीन) होते हैं, जो निश्चित ऊर्जा स्तरों में परिक्रमा करने वाले इलेक्ट्रॉनों (ऋणावेश) से घिरा होता है।",
                    general: "यहाँ इस अवधारणा का मध्यम स्तर का विवरण है। यदि आप कोई विशेष सवाल पूछना चाहते हैं, तो कृपया पूछें!"
                },
                advanced: {
                    physics: "आइये **आइंस्टीन के सामान्य सापेक्षता सिद्धांत** पर गहराई से जाएं। आइंस्टीन ने प्रतिपादित किया कि गुरुत्वाकर्षण एक पारंपरिक बल नहीं है, बल्कि स्पेस-टाइम (Spacetime) के चार-आयामी ताने-बाने को मोड़ने वाले द्रव्यमान-ऊर्जा का un ज्यामितीय परिणाम है।",
                    math: "उन्नत बीजगणित और वेक्टर स्पेस (Vector Spaces) में, रैखिक समीकरणों को वेक्टर स्पेस के बीच रैखिक परिवर्तनों के रूप में देखा जाता है। `Ax = b` को हल करने में मैट्रिक्स A के कर्नल (null space) और कॉलम स्पेस का विश्लेषण शामिल है।",
                    chemistry: "आइये **क्वांटम मैकेनिकल मॉडल** का विश्लेषण करें। इलेक्ट्रॉनों की परिक्रमा शास्त्रीय नहीं होती, बल्कि वे तरंग-फलन (wavefunction) नामक संभाव्यता घनत्व बादलों में रहते हैं, जिन्हें श्रोडिंगर समीकरण `Ĥψ = Eψ` द्वारा हल किया जाता है।",
                    general: "यहाँ इस अवधारणा का उच्च-स्तरीय वैज्ञानिक विश्लेषण है। हम गणितीय सूत्रों और जटिलताओं पर चर्चा करेंगे।"
                }
            },
            Bengali: {
                beginner: {
                    physics: "আসুন পদার্থবিজ্ঞান শিখি! **মহাকর্ষ (Gravity)** কে একটি অদৃশ্য রাবার ব্যান্ডের মতো ভাবুন যা সমস্ত কিছুকে পৃথিবীর কেন্দ্রের দিকে টানে। আপনি যখন লাফ দেন, সেই রাবার ব্যান্ড আপনাকে আবার নিচে নামিয়ে আনে। এটি না থাকলে আমরা মহাকাশে ভেসে যেতাম!",
                    math: "আসুন বীজগণিত শিখি! ধরুন আমরা একটি গোয়েন্দা খেলা খেলছি। **'x'** হলো একটি গোপন বাক্সের মতো। আমি যদি বলি `x + 3 = 10`, আমাদের খুঁজে বের করতে হবে বাক্সে কী আছে। আমরা যদি ৩ বাদ দিই, তবে দেখব বাক্সে **৭** আছে!",
                    chemistry: "আসুন পরমাণু (Atoms) শিখি! আপনার চারপাশের প্রতিটি জিনিস - আপনার ফোন, জল, গাছপালা - ক্ষুদ্র ক্ষুদ্র ব্লক দিয়ে তৈরি যাকে **পরমাণু** বলে। এগুলো মহাবিশ্বের লেগো ব্লকের মতো!",
                    general: "আমি বুঝিয়ে বলতে পেরে আনন্দিত! আসুন খুব সহজভাবে শুরু করি। এই বিষয়টিকে একটি গল্পের মতো ভাবুন..."
                },
                intermediate: {
                    physics: "আসুন **নিউটনের মহাকর্ষ সূত্র** নিয়ে আলোচনা করি। মহাকর্ষ হলো দুটি বস্তুর মধ্যকার পারস্পরিক আকর্ষণ বল। এই বল বস্তুদ্বয়ের ভরের গুণফলের সমানুপাতিক এবং তাদের মধ্যবর্তী দূরত্বের বর্গের ব্যস্তানুপাতিক: `F = G * (m1 * m2) / r^2`।",
                    math: "বীজগণিতে আমাদের মূল কাজ হলো চলকটিকে (variable) আলাদা করা। `2x + 5 = 15` এর জন্য, আমরা উভয় পক্ষ থেকে ৫ বিয়োগ করে পাই `2x = 10`, তারপর ২ দিয়ে ভাগ করে পাই `x = 5`।",
                    chemistry: "আসুন **পরমাণুর গঠন** অন্বেষণ করি। একটি পরমাণুর কেন্দ্রে থাকে ধনাত্মক প্রোটন ও চার্জহীন নিউট্রন সমৃদ্ধ নিউক্লিয়াস, যা নির্দিষ্ট শক্তির কক্ষপথে ঘূর্ণায়মান ঋণাত্মক ইলেকট্রন দ্বারা পরিবেষ্টিত থাকে।",
                    general: "এখানে এই বিষয়টির বিস্তারিত ব্যাখ্যা দেওয়া হলো। আপনার কোনো নির্দিষ্ট অংশ বুঝতে অসুবিধা হলে জানান!"
                },
                advanced: {
                    physics: "আসুন **আইনস্টাইনের সাধারণ আপেক্ষিকতা তত্ত্ব** আলোচনা করি। আইনস্টাইন দেখিয়েছেন যে মহাকর্ষ কোনো সাধারণ বল নয়, বরং এটি ভর ও শক্তির প্রভাবে চতুর্মাত্রिक স্থান-কালের (Spacetime) বেঁকে যাওয়ার একটি জ্যামিতিক ফলাফল।",
                    math: "উচ্চতর বীজগণিত ও ভেক্টর স্পেসের ক্ষেত্রে, রৈখিক সমীকরণগুলোকে ভেক্টর স্পেসের মধ্যকার রূপান্তর হিসেবে দেখা হয়। `Ax = b` সমাধান করার জন্য আমাদের ম্যাट्रिक्सের কার্নেল ও কলাম স্পেস বিশ্লেষণ করতে হয়।",
                    chemistry: "আসুন **কোয়ান্টাম মেকানিক্যাল মডেল** বিশ্লেষণ করি। এখানে ইলেকট্রনগুলো নির্দিষ্ট কক্ষপথে ঘোরে না, বরং শ্রডিঙ্গার সমীকরণ `Ĥψ = Eψ` দ্বারা সমাধানকৃত তরঙ্গের (wavefunction) সম্ভাব্যতা মেঘের মধ্যে অবস্থান করে।",
                    general: "এখানে বিষয়টির গভীর একাডেমিক এবং গাণিতিক বিশ্লেষণ দেওয়া হলো। আপনার কোনো প্রশ্ন থাকলে নির্দ্বিধায় জিজ্ঞাসা করুন।"
                }
            }
        };

        // Standard diagnostic assessment questions
        this.diagnosticQuestions = [
            {
                id: 1,
                subject: "Physics",
                question: "Which of the following forces keeps planets in orbit around the Sun?",
                options: ["Electromagnetic Force", "Gravitational Force", "Friction Force", "Nuclear Force"],
                answer: 1, // index of option
                explanation: "Gravitational force is the attractive force between objects with mass, keeping the planets locked in orbit around the solar system."
            },
            {
                id: 2,
                subject: "Math",
                question: "Solve for x: 3x - 7 = 14",
                options: ["x = 5", "x = 6", "x = 7", "x = 8"],
                answer: 2,
                explanation: "Add 7 to both sides: 3x = 21. Divide by 3: x = 7."
            },
            {
                id: 3,
                subject: "Chemistry",
                question: "What is the chemical formula of common table salt?",
                options: ["H2O", "CO2", "NaCl", "HCl"],
                answer: 2,
                explanation: "Table salt is Sodium Chloride, which has the chemical formula NaCl."
            },
            {
                id: 4,
                subject: "General Aptitude",
                question: "If a train travels at 60 km/h, how long will it take to travel 150 km?",
                options: ["1.5 Hours", "2 Hours", "2.5 Hours", "3 Hours"],
                answer: 2,
                explanation: "Time = Distance / Speed = 150 / 60 = 2.5 hours."
            }
        ];
    }

    // Evaluate diagnostic quiz score and generate starting skill levels
    evaluateDiagnostic(answers) {
        let correctCount = 0;
        const skillGraph = {
            Physics: 50,
            Math: 50,
            Chemistry: 50,
            General: 50
        };

        this.diagnosticQuestions.forEach((q, idx) => {
            const userAns = answers[q.id];
            if (userAns !== undefined && parseInt(userAns) === q.answer) {
                correctCount++;
                skillGraph[q.subject] = 80; // High score
            } else {
                skillGraph[q.subject] = 30; // Weak subject
            }
        });

        // Determine profile outcomes
        const scorePct = Math.round((correctCount / this.diagnosticQuestions.length) * 100);
        
        let focusScore = 75;
        let learningStyle = "Visual / Interactive";
        if (scorePct >= 75) {
            focusScore = 85;
            learningStyle = "Conceptual / Analytical";
        } else if (scorePct <= 25) {
            focusScore = 60;
            learningStyle = "Step-by-Step / Practical";
        }

        return {
            correct: correctCount,
            total: this.diagnosticQuestions.length,
            percentage: scorePct,
            skills: skillGraph,
            focusScore,
            learningStyle
        };
    }

    // Get dynamic chatbot responses based on inputs
    askTutor(question, subject = 'general', level = 'intermediate', language = 'English') {
        const normalized = question.toLowerCase();
        
        // Base response retrieval
        const nativeLangs = ['English', 'Hindi', 'Bengali'];
        const isNative = nativeLangs.includes(language);
        
        const langData = isNative ? this.tutorResponses[language] : this.tutorResponses['English'];
        const lvlData = langData[level] || langData['intermediate'];
        
        let mainResponse = lvlData[subject] || lvlData['general'];
        
        // If not a native language, let's dynamically translate the English template into their selected language!
        if (!isNative) {
            mainResponse = this.simulateTranslation(mainResponse, subject, level, language);
        }
        
        // Check for specific keywords to add high-fidelity dynamic feeling
        if (normalized.includes("why") || normalized.includes("reason") || normalized.includes("kaise") || normalized.includes("porque") || normalized.includes("pourquoi")) {
            if (language === 'Hindi') {
                mainResponse += "\n\n💡 **विशेष टिप:** यह इसलिए होता है क्योंकि प्रकृति हमेशा ऊर्जा के स्तर को कम से कम (minimum potential state) रखना चाहती है।";
            } else if (language === 'Bengali') {
                mainResponse += "\n\n💡 **বিশেষ টিপ:** এটি ঘটে কারণ প্রকৃতি সর্বদা শক্তির স্তর সর্বনিম্ন রাখতে চায়।";
            } else if (language === 'Spanish') {
                mainResponse += "\n\n💡 **Consejo de Experto:** Esto ocurre porque los sistemas naturales siempre buscan el estado de energía potencial más bajo para establecer el equilibrio.";
            } else if (language === 'French') {
                mainResponse += "\n\n💡 **Conseil d'Expert:** Cela se produit parce que les systèmes naturels recherchent toujours l'état d'énergie potentielle le plus bas pour établir l'équilibre.";
            } else if (language === 'German') {
                mainResponse += "\n\n💡 **Experten-Tipp:** Dies geschieht, weil natürliche Systeme immer den niedrigsten potenziellen Energiezustand anstreben, um ein Gleichgewicht herzustellen.";
            } else if (language === 'Japanese') {
                mainResponse += "\n\n💡 **プロのヒント:** 自然界のシステムは均衡を確立するために、常に最も低い位置エネルギー状態を模索するため、これが起こります。";
            } else if (language === 'Tamil') {
                mainResponse += "\n\n💡 **நிபுணர் உதவிக்குறிப்பு:** இயற்கையான அமைப்புகள் எப்பொழுதும் சமநிலையை ஏற்படுத்த மிகக் குறைந்த ஆற்றல் நிலையைத் தேடுவதால் இது நிகழ்கிறது.";
            } else if (language === 'Telugu') {
                mainResponse += "\n\n💡 **నిపుణుల చిట్కా:** సహజ వ్యవస్థలు ఎల్లప్పుడూ సమతుల్యతను ఏర్పరచడానికి అత్యల్ప సంభావ్య శక్తి స్థితిని కోరుకుంటాయి కాబట్టి ఇది జరుగుతుంది.";
            } else {
                mainResponse += `\n\n💡 **Pro-Tip [Localized to ${language}]:** This occurs because natural systems always seek the lowest potential energy state to establish dynamic equilibrium.`;
            }
        }
        
        if (normalized.includes("example") || normalized.includes("udaharan") || normalized.includes("like") || normalized.includes("ejemplo") || normalized.includes("exemple")) {
            if (language === 'Hindi') {
                mainResponse += "\n\n📋 **उदाहरण:** जैसे एक ऊंचे पहाड़ पर रखी गेंद अपने आप नीचे लुढ़क जाती है क्योंकि नीचे उसकी स्थितिज ऊर्जा (potential energy) कम होती है।";
            } else if (language === 'Bengali') {
                mainResponse += "\n\n📋 **উদাহরণ:** যেমন একটি পাহাড়ের চূড়ায় রাখা বল নিজেই নিচে গড়িয়ে পড়ে কারণ নিচে তার বিভব শক্তি (potential energy) কম থাকে।";
            } else if (language === 'Spanish') {
                mainResponse += "\n\n📋 **Ejemplo Real:** Imagina una roca pesada en la cima de una colina. Rueda espontáneamente hacia abajo porque la base representa un estado de energía más bajo y estable.";
            } else if (language === 'French') {
                mainResponse += "\n\n📋 **Exemple Concret:** Imaginez un rocher lourd au sommet d'une colline. Il roule spontanément vers le bas car la base représente un état d'énergie plus bas et plus stable.";
            } else if (language === 'German') {
                mainResponse += "\n\n📋 **Praxisbeispiel:** Stellen Sie sich einen schweren Felsbrocken auf einem Hügel vor. Er rollt spontan nach unten, weil der Boden einen stabileren, energieärmeren Zustand darstellt.";
            } else if (language === 'Japanese') {
                mainResponse += "\n\n📋 **現実の例:** 丘の上の重い岩を想像してください。底はより安定した低エネルギー状態を表すため、岩は自然に転がり落ちます。";
            } else if (language === 'Tamil') {
                mainResponse += "\n\n📋 **உண்மை உதாரணம்:** ஒரு மலையின் உச்சியில் இருக்கும் ஒரு கனமான பாறையை கற்பனை செய்து பாருங்கள். அது தன்னிச்சையாக கீழே உருளுகிறது, ஏனெனில் கீழ் பகுதி மிகவும் நிலையான, குறைந்த ஆற்றல் நிலையை குறிக்கிறது.";
            } else if (language === 'Telugu') {
                mainResponse += "\n\n📋 **నిజ జీవిత ఉదాహరణ:** కొండపై ఉన్న భారీ బండరాయిని ఊహించుకోండి. ఇది స్వయంచాలకంగా కిందికి దొర్లుతుంది ఎందుకంటే కింది భాగం మరింత స్థిరమైన, తక్కువ శక్తి స్థితిని సూచిస్తుంది.";
            } else {
                mainResponse += `\n\n📋 **Real-life Example [Localized to ${language}]:** Think of a heavy boulder at the top of a hill. It spontaneously rolls down because the bottom represents a more stable, lower-energy ground state.`;
            }
        }

        if (normalized.includes("formula") || normalized.includes("sutra") || normalized.includes("math")) {
            mainResponse += "\n\n📐 **Key Mathematical Equation:**\n`ΔE = E_final - E_initial` (For state changes)\nOr `ΣF = m * a` (Newton's 2nd Law)";
        }

        return mainResponse;
    }

    async getTutorResponse(question, subject = 'general', level = 'intermediate', language = 'English') {
        const selectedModel = (window.AppStore && window.AppStore.state.selectedModel) || 'llama3';
        
        try {
            const recentHistory = (window.AppStore && window.AppStore.state.chatHistory || [])
                .slice(-6)
                .filter(m => m.id !== 'c1')
                .map(m => ({
                    role: m.sender === 'user' ? 'user' : 'assistant',
                    content: m.text
                }));
                
            const systemPrompt = `You are "Your AI Partner", an empathetic, highly skilled personalized study tutor.
The student has chosen the language "${language}", learning level "${level}", and academic subject "${subject}".
Always structure your answers beautifully with markdown, explain core concepts with simple analogies (especially if the level is beginner), and be extremely motivating. Encourage them with positive feedback. Speak in their preferred language.`;

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: question,
                    history: recentHistory,
                    model: selectedModel,
                    system_prompt: systemPrompt
                })
            });
            
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.reply) {
                    return data.reply;
                }
            }
        } catch (e) {
            console.warn("API Chat request failed, running simulated fallback:", e);
        }
        
        return this.askTutor(question, subject, level, language);
    }

    async getCustomQuestions(subject, examType = 'General') {
        const selectedModel = (window.AppStore && window.AppStore.state.selectedModel) || 'llama3';
        try {
            const res = await fetch('/api/quiz/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject: subject,
                    examType: examType,
                    model: selectedModel
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
                    return data.questions.map((q, idx) => ({
                        id: 500 + idx,
                        subject: subject,
                        ...q
                    }));
                }
            }
        } catch (e) {
            console.warn("Could not generate custom questions with Ollama, using simulated fallback:", e);
        }
        
        return this.generateCustomQuestions(subject);
    }

    // Dynamic simulated translation mapping for 20+ languages!
    simulateTranslation(text, subject, level, language) {
        const dict = {
            Spanish: {
                greeting: "¡Hola! Como tu Compañero de Inteligencia Artificial, estoy feliz de explicarte este concepto en Español:\n\n",
                physics_beg: "¡Aprendamos física! Piensa en la **Gravedad** como una banda elástica invisible que atrae todo hacia el centro de la Tierra. Cuando saltas, la banda elástica te devuelve hacia abajo. ¡Eso es la gravedad! Sin ella, flotaríamos en el espacio. ¿No es genial?",
                physics_int: "Hablemos de la **Gravedad y la Ley de Gravitación Universal de Newton**. La gravedad es una fuerza de atracción que actúa entre dos cuerpos con masa. La fuerza es directamente proporcional al producto de sus masas e inversamente proporcional al cuadrado de la distancia entre sus centros: `F = G * (m1 * m2) / r^2`. ¡Por eso la Luna gira alrededor de la Tierra!",
                physics_adv: "Sumerjámonos en la **Relatividad General y la Curvatura del Espacio-Tiempo**. Einstein postuló que la gravedad no es una fuerza tradicional, sino una consecuencia geométrica de la masa-energía que curva el tejido de cuatro dimensiones del Espacio-Tiempo. Las ecuaciones de campo de Einstein determinan cómo la materia le dice al espacio-tiempo cómo curvarse.",
                math_beg: "¡Aprendamos Álgebra! Imagina que estamos en un juego de detectives. Una variable como **'x'** es una caja de tesoro oculta. Si digo `x + 3 = 10`, queremos encontrar qué hay dentro. Si restamos 3 de ambos lados, ¡descubrimos que la caja `x` debe contener **7**!",
                math_int: "En **Álgebra (Ecuaciones Lineales)**, nuestro objetivo es aislar la variable. Para `2x + 5 = 15`, restamos 5 de ambos lados para obtener `2x = 10`, luego dividimos entre 2 para encontrar `x = 5`. La variable representa un valor que satisface la ecuación.",
                math_adv: "En **Álgebra Avanzada y Espacios Vectoriales**, las ecuaciones lineales se estudian a través de las transformaciones lineales entre espacios vectoriales. Resolver `Ax = b` implica analizar el kernel (núcleo), el espacio de columnas y el espacio de renglones de la matriz A.",
                chem_beg: "¡Aprendamos sobre los Átomos! Todo lo que ves - tu teléfono, el agua, los árboles - está hecho de bloques de construcción diminutos llamados **átomos**. Son como las piezas de LEGO del universo.",
                chem_int: "Exploremos la **Estructura Atómica**. Un átomo consta de un núcleo denso central que contiene protones (carga positiva) y neutrones (carga neutra), rodeado por una nube de electrones (carga negativa) en órbitas de energía definidas.",
                chem_adv: "Analicemos el **Modelo Mecánico Cuántico del Átomo**. Los electrones no orbitan clásicamente, sino que residen en nubes de densidad de probabilidad llamadas funciones de onda reguladas por la Ecuación de Schrödinger: `Ĥψ = Eψ`. Los orbitales s, p, d y f representan la probabilidad de ubicación.",
                general: "¡Me encantaría explicarte! Comencemos con los aspectos fundamentales de este tema..."
            },
            French: {
                greeting: "Bonjour! En tant que votre tuteur d'IA, je suis ravi de vous expliquer ce concept en Français:\n\n",
                physics_beg: "Pensons à la **Gravité** comme un élastique invisible qui tire tout vers le centre de la Terre. Quand tu sautes, l'élastique te ramène tout de suite vers le bas. C'est ça la gravité! Sans elle, nous flotterions dans l'espace. Incroyable, non?",
                physics_int: "Discutons de la **Gravité et de la Loi Universelle de Newton**. La force gravitationnelle est directement proportionnelle au produit des masses et inversement proportionnelle au carré de la distance séparant leurs centres: `F = G * (m1 * m2) / r^2`. C'est pourquoi la Lune tourne autour de la Terre!",
                physics_adv: "Plongeons dans la **Relativité Générale**. Einstein a postulé que la gravité n'est pas une force traditionnelle, mais une conséquence géométrique de la masse-énergie courbant le tissu quadridimensionnel de l'Espace-Temps. L'équation de champ d'Einstein décrit comment la matière dicte à l'espace-temps comment se courber.",
                math_beg: "Apprenons l'Algèbre! Imagine que nous jouons à un jeu de détective. Une variable comme **'x'** est une boîte au trésor cachée. Si je dis `x + 3 = 10`, nous voulons trouver ce qu'il y a dedans. Si nous enlevons 3, nous découvrons que la boîte `x` doit contenir **7**!",
                math_int: "En **Algèbre (Équations Linéaires)**, notre objectif est d'isoler la variable. Pour `2x + 5 = 15`, nous soustrayons 5 des deux côtés pour obtenir `2x = 10`, puis divisons par 2 pour trouver `x = 5`.",
                math_adv: "En **Algèbre Avancée et Espaces Vectoriels**, les équations linéaires sont étudiées sous l'angle des transformations linéaires entre espaces vectoriels. La résolution de `Ax = b` implique l'analyse du noyau, de l'espace des colonnes et de l'espace des lignes.",
                chem_beg: "Apprenons les Atomes! Tout ce que tu vois est composé de minuscules blocs de construction appelés **atomes**. Ce sont comme les briques LEGO de l'univers.",
                chem_int: "Explorons la **Structure Atomique**. Un atome est constitué d'un noyau central dense contenant des protons (charge positive) et des neutrons (neutres), entouré d'électrons (charge négative) gravitant sur des couches d'énergie définies.",
                chem_adv: "Analysons le **Modèle Quantique de l'Atome**. Les électrons résident dans des nuages de densité de probabilité appelés fonctions d'onde, résolus par l'Équation de Schrödinger: `Ĥψ = Eψ`.",
                general: "Je serais ravi d'expliquer ce concept! Commençons par les fondations théoriques..."
            },
            German: {
                greeting: "Hallo! Als Ihr KI-Lernpartner freue ich mich, Ihnen dieses Konzept auf Deutsch zu erklären:\n\n",
                physics_beg: "Lernen wir Physik! Stell dir die **Schwerkraft** wie ein unsichtbares Gummiband vor, das alles zum Mittelpunkt der Erde zieht. Wenn du springst, zieht dich das Gummiband sofort wieder nach unten.",
                physics_int: "Newton besagt, dass die Gravitationskraft direkt proportional zum Produkt der Massen und umgekehrt proportional zum Quadrat des Abstands ist: `F = G * (m1 * m2) / r^2`.",
                physics_adv: "In der **Allgemeinen Relativitätstheorie** erklärte Einstein die Gravitation als geometrische Krümmung der vierdimensionalen Raumzeit durch Masse und Energie.",
                math_beg: "Lernen wir Algebra! Stell dir vor, wir sind Detektive. Eine Variable wie **'x'** ist eine versteckte Schatztruhe. Bei `x + 3 = 10` muss sich in der Kiste **7** befinden!",
                math_int: "In der **Algebra (Lineare Gleichungen)** isolieren wir die Variable. Bei `2x + 5 = 15` subtrahieren wir 5 und teilen durch 2, um `x = 5` zu erhalten.",
                math_adv: "In der **Höheren Algebra** betrachten wir lineare Gleichungen als Transformationen zwischen Vektorräumen, gelöst durch Matrizenrechnung `Ax = b`.",
                chem_beg: "Lernen wir Atome! Alles, was du siehst, besteht aus winzigen Bausteinen, den **Atomen**. Sie sind wie LEGO-Steine des Universums.",
                chem_int: "Die **Atomstruktur** besteht aus einem dichten Kern (Protonen und Neutronen) und einer umgebenden Hülle aus negativ geladenen Elektronen.",
                chem_adv: "Im **Quantenmechanischen Atommodell** beschreiben wir Elektronen durch Wellenfunktionen, gelöst über die Schrödinger-Gleichung: `Ĥψ = Eψ`.",
                general: "Gerne erkläre ich dieses Konzept! Beginnen wir mit den Grundlagen..."
            },
            Tamil: {
                greeting: "வணக்கம்! உங்கள் AI கல்வித் துணையாக, இந்த கருத்தை நான் தமிழில் விளக்குகிறேன்:\n\n",
                physics_beg: "இயற்பியல் கற்போம்! **புவியீர்ப்பு விசை (Gravity)** என்பது பூமியின் மையத்தை நோக்கி அனைத்தையும் இழுக்கும் ஒரு கண்ணுக்கு தெரியாத ரப்பர் பேண்ட் போன்றது. நீங்கள் குதிக்கும் போது அது உங்களை கீழே இழுக்கிறது.",
                physics_int: "நியூட்டனின் ஈர்ப்பு விதிப்படி, இரு பொருள்களுக்கு இடையேயான ஈர்ப்பு விசை அவற்றின் நிறைகளின் பெருக்கற்பலனுக்கு நேர் விகிதத்திலும், அவற்றுக்கு இடையே உள்ள தூரத்தின் இருமடிக்கு எதிர் விகிதத்திலும் இருக்கும்: `F = G * (m1 * m2) / r^2`.",
                physics_adv: "ஐன்ஸ்டீனின் பொதுச் சார்பியல் கோட்பாட்டின்படி, ஈர்ப்பு என்பது ஒரு பாரம்பரிய விசை அல்ல, மாறாக நிறை மற்றும் ஆற்றல் விண்வெளி நேரத்தின் (Spacetime) வளைவை ஏற்படுத்தும் ஒரு வடிவியல் விளைவு ஆகும்.",
                math_beg: "இயற்கணிதம் (Algebra) கற்போம்! நாம் ஒரு துப்பறியும் விளையாட்டு விளையாடுவதாக நினைத்துக் கொள்ளுங்கள். **'x'** என்பது ஒரு மறைக்கப்பட்ட புதையல் பெட்டி. `x + 3 = 10` என்றால், பெட்டிக்குள் **7** இருக்க வேண்டும்!",
                math_int: "இயற்கணிதத்தில், நமது நோக்கம் மாறியை (variable) தனிமைப்படுத்துவதாகும். `2x + 5 = 15` க்கு, இருபுறமும் 5 ஐ கழித்தால் `2x = 10` கிடைக்கும், பின்னர் 2 ஆல் வகுத்தால் `x = 5` ஆகும்.",
                math_adv: "உயர் இயற்கணிதத்தில், நேரியல் சமன்பாடுகள் வெக்டர் வெளிகளுக்கு இடையிலான நேரியல் மாற்றங்களாக பார்க்கப்படுகின்றன. `Ax = b` ஐ தீர்ப்பது அணி (matrix) மூலம் பகுப்பாய்வு செய்யப்படுகிறது.",
                chem_beg: "அணுக்கள் (Atoms) கற்போம்! நீங்கள் பார்க்கும் அனைத்தும் **அணுக்கள்** எனப்படும் சிறிய கட்டுமான தொகுதிகளால் ஆனவை. அவை பிரபஞ்சத்தின் லெகோ (LEGO) கற்கள் போன்றது.",
                chem_int: "அணு அமைப்பில் புரோட்டான்கள் (நேர் மின்சுமை) மற்றும் நியூட்ரான்களைக் கொண்ட ஒரு அடர்த்தியான அணுக்கருவும், அதைச் சுற்றி ஆற்றல் மட்டங்களில் சுழலும் எலக்ட்ரான்களும் (எதிர் மின்சுமை) உள்ளன.",
                chem_adv: "குவாண்டம் இயக்கவியல் மாதிரியில், எலக்ட்ரான்கள் சுரோடிங்கர் சமன்பாடு `Ĥψ = Eψ` மூலம் தீர்க்கப்படும் அலைச்சார்பு (wavefunction) எனப்படும் நிகழ்தகவு மேகங்களில் வாழ்கின்றன.",
                general: "விளக்குவதில் மகிழ்ச்சி! முதலில் இந்த பாடத்தின் அடிப்படைகளை பார்ப்போம்..."
            },
            Telugu: {
                greeting: "నమస్కారం! మీ AI విద్యా భాగస్వామిగా, ఈ భావనను నేను తెలుగులో వివరిస్తాను:\n\n",
                physics_beg: "భౌతిక శాస్త్రం నేర్చుకుందాం! **గురుత్వాకర్షణ (Gravity)** అనేది ఒక అదృశ్య రబ్బర్ బ్యాండ్ లాంటిది, ఇది ప్రతిదానిని భూమి కేంద్రం వైపు లాగుతుంది. మీరు పైకి ఎగిరినప్పుడు అది మిమ్మల్ని కిందకు లాగుతుంది.",
                physics_int: "న్యూటన్ గురుత్వాకర్షణ నియమం ప్రకారం, విశ్వంలో ఏవైనా రెండు ద్రవ్యరాశుల మధ్య ఉండే ఆకర్షణ బలం వాటి ద్రవ్యరాశుల గుణకారానికి ప్రత్యక్ష అనుపాతంలోనూ, వాటి మధ్య దూరపు వర్గానికి విలోమానుపాతంలోనూ ఉంటుంది: `F = G * (m1 * m2) / r^2`.",
                physics_adv: "ఐన్‌స్టీన్ సాధారణ సాపేక్షత సిద్ధాంతం ప్రకారం, గురుత్వాకర్షణ అనేది ఒక సాధారణ బలం కాదు, ద్రవ్యరాశి మరియు శక్తి స్పేస్-టైమ్ (Spacetime) ను వంచడం వల్ల ఏర్పడే రేఖాగణిత ఫలితం.",
                math_beg: "బీజగణితం (Algebra) నేర్చుకుందాం! మనం ఒక డిటెక్టివ్ గేమ్ ఆడుతున్నామని ఊహించుకోండి. **'x'** అనేది దాచిన నిధి పెట్టె. `x + 3 = 10` అంటే, ఆ పెట్టెలో **7** ఉండాలి!",
                math_int: "బీజగణితంలో మన లక్ష్యం చరాంకం (variable) ను విడదీయడం. `2x + 5 = 15` కొరకు, ఇరువైపులా 5 తీసివేస్తే `2x = 10` వస్తుంది, ఆపై 2 తో భాగిస్తే `x = 5` అవుతుంది.",
                math_adv: "ఉన్నత బీజగణితంలో, సరళ సమీకరణాలను వెక్టర్ స్పేస్‌ల మధ్య సరళ రూపాంతరాలుగా చూస్తారు. `Ax = b` ను పరిష్కరించడానికి మాతృకల (matrix) విశ్లేషణ అవసరం.",
                chem_beg: "పరమాణువులు (Atoms) నేర్చుకుందాం! మీరు చూసే ప్రతిదీ **పరమాణువులు** అనబడే చిన్న నిర్మాణ ఇటుకలతో చేయబడింది. ఇవి విశ్వం యొక్క లెగో (LEGO) బ్లాక్స్ లాంటివి.",
                chem_int: "పరమాణు నిర్మాణంలో ప్రోటాన్లు మరియు న్యూట్రాన్లు ఉండే కేంద్రకం, దాని చుట్టూ కక్ష్యలలో తిరిగే ఎలక్ట్రాన్లు ఉంటాయి.",
                chem_adv: "క్వాంటం మెకానికల్ మోడల్‌లో, ఎలక్ట్రాన్లు ష్రోడింగర్ సమీకరణం `Ĥψ = Eψ` ద్వారా పరిష్కరించబడే తరంగ ప్రమేయం (wavefunction) లలో ఉంటాయి.",
                general: "వివరించడానికి నేను సిద్ధంగా ఉన్నాను! మొదట ఈ అంశం యొక్క ప్రాథమిక విషయాలను చూద్దాం..."
            }
        };

        const lang = dict[language];
        if (lang) {
            // Check subject key mapping
            let key = "general";
            if (subject === "physics") {
                key = level === "beginner" ? "physics_beg" : (level === "advanced" ? "physics_adv" : "physics_int");
            } else if (subject === "math") {
                key = level === "beginner" ? "math_beg" : (level === "advanced" ? "math_adv" : "math_int");
            } else if (subject === "chemistry") {
                key = level === "beginner" ? "chem_beg" : (level === "advanced" ? "chem_adv" : "chem_int");
            }
            return lang.greeting + (lang[key] || lang.general);
        }

        // Generic fallback greeting translator simulator for other languages (French/Japanese/Urdu/Sanskrit/etc.)
        let greeting = `[AI Partner localized explanation in ${language}]:\n\n`;
        if (language === 'Japanese') greeting = "こんにちは！ AIパートナーとして、この概念を日本語で説明します：\n\n";
        else if (language === 'Mandarin') greeting = "你好！ 作为您的AI学习伙伴，我很乐意用中文为您解释这个概念：\n\n";
        else if (language === 'Russian') greeting = "Здравствуйте! Как ваш партнер по искусственному интеллекту, я рад объяснить эту концепцию на русском языке:\n\n";
        else if (language === 'Arabic') greeting = "مرحباً! بصفتي شريكك التعليمي القائم على الذكاء الاصطناعي، يسعدني أن أشرح لك هذا المفهوم باللغة العربية:\n\n";
        else if (language === 'Urdu') greeting = "اسلام علیکم! آپ کے AI پارٹنر کے طور پر، میں اردو میں اس تصور کی وضاحت کرنے پر خوش ہوں:\n\n";
        else if (language === 'Sanskrit') greeting = "नमो नमः! अहम् तव कृते संस्कृतभाषायाम् इमं विषयं पाठयामि:\n\n";
        else if (language === 'Marathi') greeting = "नमस्कार! मी तुमचा AI अभ्यास सोबती म्हणून हा विषय मराठीत स्पष्ट करतो:\n\n";
        else if (language === 'Gujarati') greeting = "नमस्ते! हुं तमारा AI अभ्यास साथी तरीक़े आ मुद्દો गुजरातीमां समजावू छुं:\n\n";
        else if (language === 'Kannada') greeting = "ನಮಸ್ಕಾರ! ನಿಮ್ಮ AI ಕಲಿಕಾ భాగీದಾರನಾಗಿ, ಈ ಪರಿಕಲ್ಪನೆಯನ್ನು ನಾನು ಕನ್ನಡದಲ್ಲಿ ವಿವರಿಸುತ್ತೇನೆ:\n\n";
        else if (language === 'French') greeting = "Bonjour! En tant que votre tuteur d'IA, je suis ravi de vous expliquer ce concept en Français:\n\n";
        else if (language === 'German') greeting = "Hallo! Als Ihr KI-Lernpartner freue ich mich, Ihnen dieses Konzept auf Deutsch zu erklären:\n\n";
        
        return greeting + text;
    }

    // Generate comprehensive carrier roadmap based on selection
    generateCareerRoadmap(careerGoal) {
        const goal = careerGoal.toLowerCase();
        
        if (goal.includes("ai") || goal.includes("machine learning") || goal.includes("coder") || goal.includes("engineer")) {
            return {
                title: "AI/ML & Software Engineering Career Path",
                description: "A fast-growing path focusing on mathematics, programming, and data engineering.",
                steps: [
                    { title: "Foundations (Month 1-3)", desc: "Master Python programming, linear algebra, calculus, and basic database SQL." },
                    { title: "Data Structures & Core CS (Month 4-6)", desc: "Study core Algorithms, Object Oriented Programming, and GitHub version control." },
                    { title: "Machine Learning Core (Month 7-9)", desc: "Learn Scikit-Learn, regression, decision trees, neural network theories, and data visualization." },
                    { title: "Deep Learning & Projects (Month 10-12)", desc: "Build hands-on projects using PyTorch/TensorFlow, train LLMs, and launch portfolio apps." }
                ],
                salary: "₹8L - ₹25L per annum (Entry Level in India)",
                skills: ["Python", "PyTorch", "SQL", "Linear Algebra", "Data Structures", "APIs"],
                certifications: "Google AI Professional, AWS Machine Learning Specialty, DeepLearning.AI Courses"
            };
        } else if (goal.includes("upsc") || goal.includes("government") || goal.includes("ssc") || goal.includes("civil")) {
            return {
                title: "Civil Services / UPSC Strategy Roadmap",
                description: "A high-discipline path targeting administration, governance, and national development.",
                steps: [
                    { title: "Syllabus & NCERTs (Month 1-4)", desc: "Read basic NCERT school text books (Class 6-12) for History, Polity, Geography, and Economics." },
                    { title: "Standard Material & Answer Writing (Month 5-8)", desc: "Study advanced references (Laxmikanth, Ramesh Singh), and write daily answers for GS papers." },
                    { title: "Mock Tests & Current Affairs (Month 9-11)", desc: "Attempt daily UPSC Prelims mock question series, analyze weaknesses, and study newspapers (The Hindu)." },
                    { title: "Revision & Final Simulation (Month 12)", desc: "Focus 100% on timed mock exam series and optional subject answers." }
                ],
                salary: "IAS Officer Rank starting basic scale (~₹56,100/mo + security & housing privileges)",
                skills: ["Critical Analysis", "High Reading Comprehension", "Drafting/Report Writing", "Public Speaking"],
                certifications: "Standard UPSC Preliminary Qualification, Civil Service Interview coaching reviews"
            };
        } else {
            // General Student Success roadmap
            return {
                title: "Academic Excellence & Strategic Higher Education Path",
                description: "A highly tailored approach to securing college admissions and competitive ranks.",
                steps: [
                    { title: "Concept Clarity (Daily)", desc: "Study weak topics first, and create active recall flashcards for formulas." },
                    { title: "Daily Practice (Weekly)", desc: "Solve at least 20 MCQ questions and revise past school notes." },
                    { title: "Performance Benchmarking (Monthly)", desc: "Sit for adaptive mock tests and document mistakes in an error-log notebook." },
                    { title: "Revision Spaced Cycles (Ongoing)", desc: "Revise concepts on Day 1, Day 7, Day 15, and Day 30 to lock them into long-term memory." }
                ],
                salary: "Excellent academic grade points & top-tier university scholarships",
                skills: ["Spaced Repetition", "Self-Discipline", "Time Management", "Active Note Taking"],
                certifications: "School Merits, Exam Board Honors, Talent Search Scholarships"
            };
        }
    }

    // Generate wellness check feedback based on stress & mood
    evaluateWellness(mood, stressScore, sleepHours) {
        stressScore = parseInt(stressScore);
        sleepHours = parseFloat(sleepHours);
        
        let response = {
            level: "Normal",
            message: "You are doing great! Keep a healthy balance between work and play.",
            helplineNeeded: false,
            tips: [
                "Stay hydrated (drink 3 liters of water daily).",
                "Take a 5-minute break for every 25 minutes of studying (Pomodoro).",
                "Take a quick 10-minute walk in nature to clear your head."
            ]
        };

        if (stressScore >= 8) {
            response.level = "Critical Stress Detected";
            response.helplineNeeded = true;
            response.message = "Hey, you seem extremely overwhelmed. High exam stress is completely natural, but your mental peace is more important than any grade. Please take a deep breath, close your books for today, and rest.";
            response.tips = [
                "🎯 **Immediate Action:** Try our guided box breathing simulator below (4s inhale, 4s hold, 4s exhale, 4s hold).",
                "👪 **Talk to Someone:** Call a trusted family member, guardian, or friend and express how you feel.",
                "📞 **Professional Helpline:** Remember, you are never alone. Reach out to free mental support helplines immediately."
            ];
        } else if (stressScore >= 5) {
            response.level = "Moderate Stress";
            response.message = "You're holding up, but pressure is building up. It is time to add some self-care boundaries to your study routing.";
            response.tips = [
                "💤 **Check Sleep:** Ensure you sleep at least 7-8 hours tonight. Sleep is where memories are consolidated!",
                "🚶 **Physical Movement:** Exercise or stretch for 15 minutes. It releases endorphins that combat cortisol.",
                "✍:// **Journaling:** Write down exactly what you are afraid of in a notepad. Putting it on paper reduces anxiety."
            ];
        }

        if (sleepHours < 6) {
            response.tips.push("⚠️ **Sleep Alert:** You slept less than 6 hours. Lack of sleep reduces brain focus by 40%. Go to bed early today!");
        }

        return response;
    }

    // Speak text using Web Speech API (TTS)
    speak(text) {
        if ('speechSynthesis' in window) {
            // Cancel current speeches
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
            // Try to match standard English/Hindi voices
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // Default to a sweet female voice if possible
                const matched = voices.find(v => v.name.includes("Google") || v.name.includes("Female") || v.lang.startsWith("en"));
                if (matched) utterance.voice = matched;
            }
            
            window.speechSynthesis.speak(utterance);
        } else {
            console.warn("Speech Synthesis not supported in this browser.");
        }
    }

    // Stop speaking
    stopSpeaking() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }

    // Generate personalized study planner timetables
    generateSchedule(goal, studyHours, weakSubjects) {
        studyHours = parseInt(studyHours) || 4;
        const subjects = weakSubjects.length > 0 ? weakSubjects : ["General Aptitude", "Self Reading"];
        
        // Dynamic agenda slots
        const slots = [];
        let currentHour = 8; // Start study schedule at 8:00 AM
        
        slots.push({
            time: "07:00 AM - 08:00 AM",
            activity: "☀️ Wake Up, Hydrate & Daily Motivation Check-in",
            type: "routine"
        });

        // Distribute study hours among subjects, giving priority to weak ones
        let remainingHours = studyHours;
        let subjectIndex = 0;
        
        while (remainingHours > 0) {
            const currentSubj = subjects[subjectIndex % subjects.length];
            const studyChunk = remainingHours >= 2 ? 2 : 1;
            
            const startStr = `${String(currentHour).padStart(2, '0')}:00 AM`;
            const endStr = `${String(currentHour + studyChunk).padStart(2, '0')}:00 AM`;
            
            slots.push({
                time: `${startStr} - ${endStr}`,
                activity: `📖 Learn: ${currentSubj} Fundamentals (Active Reading & Flashcards)`,
                type: "study",
                subject: currentSubj,
                hours: studyChunk
            });
            
            currentHour += studyChunk;
            remainingHours -= studyChunk;
            
            // Add a short break
            slots.push({
                time: `${String(currentHour).padStart(2, '0')}:00 AM - ${String(currentHour).padStart(2, '0')}:30 AM`,
                activity: "☕ Pomodoro Rest Break (Stretch & Water)",
                type: "break"
            });
            
            currentHour += 0.5; // add 30m break
            subjectIndex++;
        }

        slots.push({
            time: "03:00 PM - 04:30 PM",
            activity: "✍️ Mock Test Practice & Doubt Clearance on Your AI Partner",
            type: "test"
        });

        slots.push({
            time: "08:00 PM - 09:00 PM",
            activity: "🔄 Spaced Repetition Revision Cycle (Day's Notes Quick Review)",
            type: "revision"
        });

        slots.push({
            time: "09:30 PM - 10:00 PM",
            activity: "🧘 Mindful Reflection & Sleep Log Check-in",
            type: "routine"
        });

        return slots;
    }

    // Generate high-fidelity dynamic questions for custom typed subjects
    generateCustomQuestions(subject) {
        const sub = subject.toLowerCase();
        
        // Return 4 beautiful questions based on the name of the subject
        if (sub.includes("bio") || sub.includes("life") || sub.includes("medical") || sub.includes("plant") || sub.includes("animal")) {
            return [
                {
                    id: 101,
                    subject: subject,
                    question: "Which of the following cell organelles is known as the powerhouse of the cell?",
                    options: ["Ribosome", "Mitochondria", "Lysosome", "Golgi Apparatus"],
                    answer: 1,
                    explanation: "Mitochondria are known as the powerhouse of the cell because they generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy."
                },
                {
                    id: 102,
                    subject: subject,
                    question: "What is the green pigment in plants that absorbs light energy for photosynthesis?",
                    options: ["Carotenoid", "Chlorophyll", "Hemoglobin", "Melanin"],
                    answer: 1,
                    explanation: "Chlorophyll is the green pigment located within chloroplasts that absorbs light energy required for the photosynthesis process."
                },
                {
                    id: 103,
                    subject: subject,
                    question: "Which blood cells are responsible for carrying oxygen throughout the body?",
                    options: ["White Blood Cells", "Red Blood Cells", "Platelets", "Lymphocytes"],
                    answer: 1,
                    explanation: "Red blood cells (erythrocytes) contain hemoglobin, which binds to oxygen and carries it from the lungs to the rest of the body."
                },
                {
                    id: 104,
                    subject: subject,
                    question: "What is the basic structural and functional unit of heredity in living organisms?",
                    options: ["Chromosome", "Gene", "Proteins", "Nucleus"],
                    answer: 1,
                    explanation: "A gene is the basic physical and functional unit of heredity, made up of sequences of DNA."
                }
            ];
        } else if (sub.includes("hist") || sub.includes("civic") || sub.includes("social") || sub.includes("polity") || sub.includes("geog")) {
            return [
                {
                    id: 201,
                    subject: subject,
                    question: "Who was the first President of the United States?",
                    options: ["Thomas Jefferson", "George Washington", "Abraham Lincoln", "John Adams"],
                    answer: 1,
                    explanation: "George Washington served as the first president of the United States from 1789 to 1797."
                },
                {
                    id: 202,
                    subject: subject,
                    question: "In which year did World War II officially end?",
                    options: ["1918", "1939", "1945", "1950"],
                    answer: 2,
                    explanation: "World War II officially ended on September 2, 1945, after the formal signing of surrender documents by Japan."
                },
                {
                    id: 203,
                    subject: subject,
                    question: "Which ancient civilization built the Great Pyramids of Giza?",
                    options: ["Mesopotamians", "Romans", "Ancient Egyptians", "Greeks"],
                    answer: 2,
                    explanation: "The Great Pyramids of Giza were built by the Ancient Egyptians during the Old Kingdom period as monumental tombs for their pharaohs."
                },
                {
                    id: 204,
                    subject: subject,
                    question: "Which document begins with the famous phrase: 'We the People'?",
                    options: ["Declaration of Independence", "US Constitution", "Magna Carta", "Bill of Rights"],
                    answer: 1,
                    explanation: "The preamble of the Constitution of the United States begins with 'We the People', establishing that the power of the government comes from its citizens."
                }
            ];
        } else {
            // General custom subject questions template
            return [
                {
                    id: 301,
                    subject: subject,
                    question: `What is the primary scientific or scholarly methodology employed in the study of ${subject}?`,
                    options: ["Empirical Observation & Analysis", "Pure Intuition", "Random Guessing", "Historical Anecdotes Only"],
                    answer: 0,
                    explanation: `Empirical observation and methodical analysis form the core foundation for research in ${subject}.`
                },
                {
                    id: 302,
                    subject: subject,
                    question: `Which of the following is considered a core, fundamental principle of ${subject}?`,
                    options: ["Dynamic Equilibrium & Systemic Contexts", "Static isolation of variables", "Ignoring environmental feedback loops", "Relying on outdated traditional dogmas"],
                    answer: 0,
                    explanation: `Dynamic equilibrium and systems analysis represent modern core pillars of understanding in ${subject}.`
                },
                {
                    id: 303,
                    subject: subject,
                    question: `In ${subject}, how do experts typically validate new theories or frameworks?`,
                    options: ["Peer-reviewed replication and data verification", "Personal popularity of the researcher", "Political authority approval", "Averaging public opinion on internet forums"],
                    answer: 0,
                    explanation: "Peer review, rigorous replication, and statistical/logical verification are key to validating new models."
                },
                {
                    id: 304,
                    subject: subject,
                    question: `Why is active, personalized study of ${subject} highly beneficial for students?`,
                    options: ["It deepens conceptual clarity, cognitive skills, and problem-solving focus", "It guarantees high marks without study efforts", "It replaces the need to learn mathematics", "It provides simple rote-memorization templates only"],
                    answer: 0,
                    explanation: `Active personalized learning of ${subject} equips students with long-term retention and analytical skills.`
                }
            ];
        }
    }
}

// Global Single Instance
window.AIService = new AIService();
