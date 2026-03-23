
const html = document.documentElement;
const metaTag = document.getElementById('theme-meta');

function toggleTheme() {
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    metaTag.setAttribute('content', isDark ? '#f2f2f7' : '#111113');
    localStorage.setItem('calcfx-theme', isDark ? 'light' : 'dark');
}

// Persist theme
(function () {
    const saved = localStorage.getItem('calcfx-theme');
    if (saved === 'dark') {
        html.setAttribute('data-theme', 'dark');
        metaTag.setAttribute('content', '#111113');
    }
})();

/* ─────────── Calculator State ─────────── */
const s = {
    current: '',
    operator: null,
    previous: null,
    waitingForOperand: false,
};

/* ─────────── Display ─────────── */
function formatDisplay(val) {
    if (val === '' || val === '0') return '';
    const n = parseFloat(val);
    if (isNaN(n)) return '';
    if (Math.abs(n) >= 1e10) return n.toExponential(3);
    const [int, dec] = n.toString().split('.');
    const formatted = parseInt(int).toLocaleString('en-US');
    return dec !== undefined ? `${formatted}.${dec}` : formatted;
}

function updateDisplay() {
    const disp = document.getElementById('display');

    disp.textContent = formatDisplay(s.current);

    disp.classList.add('flash');
    setTimeout(() => disp.classList.remove('flash'), 120);
}

/* ─────────── Logic ─────────── */
function compute(a, b, op) {
    switch (op) {
        case '+': return a + b;
        case '-': return a - b;
        case '×': return a * b;
        case '÷': return b !== 0 ? a / b : 0;
        default: return b;
    }
}

function action(key) {
    if (key === 'icon') return;

    if (key === 'AC') {
        s.current = '0';
        s.operator = null;
        s.previous = null;
        s.waitingForOperand = false;
        updateDisplay();
        return;
    }

    if (key === '±') {
        s.current = String(parseFloat(s.current) * -1);
        updateDisplay();
        return;
    }

    if (key === '%') {
        s.current = String(parseFloat(s.current) / 100);
        updateDisplay();
        return;
    }

    if (['+', '-', '×', '÷'].includes(key)) {
        if (s.operator && !s.waitingForOperand) {
            const result = compute(parseFloat(s.previous), parseFloat(s.current), s.operator);
            s.current = String(result);
        }
        s.previous = s.current;
        s.operator = key;
        s.waitingForOperand = true;
        updateDisplay();
        return;
    }

    if (key === '=') {
        if (s.operator && s.previous !== null) {
            const result = compute(parseFloat(s.previous), parseFloat(s.current), s.operator);
            s.current = String(result);
            s.operator = null;
            s.previous = null;
            s.waitingForOperand = false;
            updateDisplay();
        }
        return;
    }

    if (key === '.') {
        if (s.waitingForOperand) {
            s.current = '0.';
            s.waitingForOperand = false;
        } else if (!s.current.includes('.')) {
            s.current += '.';
        }
        updateDisplay();
        return;
    }

    // Digit
    if (s.waitingForOperand) {
        s.current = key;
        s.waitingForOperand = false;
    } else {
        s.current = s.current === '0' ? key : s.current + key;
    }
    updateDisplay();
}

/* ─────────── Keyboard Support ─────────── */
const KEY_MAP = {
    '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
    '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
    '+': '+', '-': '-', '*': '×', '/': '÷',
    '%': '%', '.': '.', ',': '.',
    'Enter': '=', '=': '=',
    'Backspace': 'AC', 'Escape': 'AC',
};

document.addEventListener('keydown', e => {
    const k = KEY_MAP[e.key];
    if (k) {
        e.preventDefault();
        action(k);
    }
});

/* ─────────── PWA ─────────── */
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
            console.log('Service Worker registration failed:', error);
        });
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('pwa-banner').style.display = 'flex';
});


/* ─────────── Init ─────────── */
updateDisplay();
