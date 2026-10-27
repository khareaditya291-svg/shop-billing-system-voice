// Local Marathi Prices Database
const LOCAL_PRICES = {
    "दूध": 30, "दुध": 30, "दही": 35, "ताक": 15, "लोणी": 60, "बटर": 50,
    "चीझ": 75, "पनीर": 120, "ब्रेड": 40, "पाव": 15, "बिस्कीट": 10,
    "कुरकुरे": 20, "कुडकुडे": 20, "वेफर्स": 20, "चीप्स": 20, "तांदूळ": 60,
    "गहू": 45, "साखर": 42, "गूळ": 60, "मीठ": 20, "डाळ": 120, "तेल": 140,
    "तूप": 350, "साबण": 35, "डिटर्जंट": 110, "निर्मा": 110, "चहा": 45
};

let cart = [];
let isListeningActive = false;

const micBtn = document.getElementById('micBtn');
const voiceStatus = document.getElementById('voiceStatus');
const cartBody = document.getElementById('cartBody');
const subtotalEl = document.getElementById('subtotal');
const gstEl = document.getElementById('gstAmount');
const grandTotalEl = document.getElementById('grandTotal');

// Web Speech API Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'mr-IN'; // Marathi language listening
    recognition.continuous = true; // Keep listening continuously until 'stop' command
    recognition.interimResults = false;

    // Toggle Voice Start / Stop
    micBtn.addEventListener('click', () => {
        if (!isListeningActive) {
            startListening(recognition);
        } else {
            stopListening(recognition);
        }
    });

    recognition.onresult = (event) => {
        const lastIndex = event.results.length - 1;
        const transcript = event.results[lastIndex][0].transcript.trim().toLowerCase();
        
        voiceStatus.innerText = `👉 तुम्ही म्हणालात: "${transcript}"`;

        // Check for Stop Triggers in Speech
        const stopWords = ['थांबा', 'थांब', 'बिल', 'पूर्ण', 'झालं', 'stop', 'checkout'];
        const matchesStop = stopWords.some(word => transcript.includes(word));

        if (matchesStop) {
            voiceStatus.innerText = "🛑 ['थांबा' आदेश मिळाला! बिल पूर्ण केले आहे.]";
            stopListening(recognition);
        } else {
            processVoiceOrder(transcript);
        }
    };

    recognition.onend = () => {
        // Automatically restart if user hasn't explicitly stopped listening
        if (isListeningActive) {
            try {
                recognition.start();
            } catch (e) {
                // Already started or busy
            }
        } else {
            micBtn.classList.remove('listening');
            micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> व्हॉईस सुरू करा (Start Voice Order)';
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech') {
            voiceStatus.innerText = "⏳ बोलणे ऐकू आले नाही, माइक सुरू आहे...";
        } else {
            voiceStatus.innerText = `⚠️ त्रुटी: ${event.error}`;
        }
    };
} else {
    voiceStatus.innerText = "तुमच्या ब्राऊझरमध्ये व्हॉईस सपोर्ट उपलब्ध नाही.";
    micBtn.disabled = true;
}

function startListening(recognition) {
    isListeningActive = true;
    try {
        recognition.start();
    } catch (e) {}
    micBtn.classList.add('listening');
    micBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i> थांबवा (Stop Listening)';
    voiceStatus.innerText = "🎙️ माइक सुरू आहे... वस्तू सांगा. थांबवण्यासाठी 'थांबा' म्हणा.";
}

function stopListening(recognition) {
    isListeningActive = false;
    try {
        recognition.stop();
    } catch (e) {}
    micBtn.classList.remove('listening');
    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i> व्हॉईस सुरू करा (Start Voice Order)';
}

// Process Marathi Spoken Transcript into Cart Items
function processVoiceOrder(text) {
    const marathiDigits = {
        "एक": 1, "दोन": 2, "तीन": 3, "चार": 4, "पाच": 5,
        "सहा": 6, "सात": 7, "आठ": 8, "नऊ": 9, "दहा": 10
    };
    
    let words = text.split(/\s+/);
    let currentQty = 1;

    words.forEach(word => {
        let cleanWord = word.replace(/[^\w\u0900-\u097F]/g, '').trim();
        
        if (!cleanWord || ['थांबा', 'थांब', 'बिल', 'करा', 'झालं', 'stop'].includes(cleanWord)) {
            return;
        }

        if (marathiDigits[cleanWord]) {
            currentQty = marathiDigits[cleanWord];
        } else if (!isNaN(parseInt(cleanWord))) {
            currentQty = parseInt(cleanWord);
        } else {
            let item = cleanWord;
            let price = LOCAL_PRICES[item] || 30;
            addItemToCart(item, currentQty, price);
            currentQty = 1; // reset quantity for next item