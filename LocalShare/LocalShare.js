const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    maxHttpBufferSize: 50 * 1024 * 1024 // 50MB file limit
});

const PORT = 3000;

let sharedData = {
    text: "",
    files: []
};

function getLocalIp() {
    const { networkInterfaces } = require('os');
    const interfaces = networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "Local Share",
        "short_name": "Local Share",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#4f46e5",
        "orientation": "portrait-primary",
        "icons": [
            {
                "src": "https://cdn-icons-png.flaticon.com/512/5266/5266185.png",
                "sizes": "512x512",
                "type": "image/png",
                "purpose": "any maskable"
            }
        ]
    });
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        const CACHE_NAME = 'synchub-v3';
        self.addEventListener('install', (e) => {
            e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(['/'])));
            self.skipWaiting();
        });
        self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
        self.addEventListener('fetch', (e) => {
            e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        });
    `);
});

app.get('/', (req, res) => {
    const currentIp = getLocalIp();
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Local share</title>
    <link rel="manifest" href="/manifest.json">
    <meta name="theme-color" content="#4f46e5">
    <meta name="mobile-web-app-capable" content="yes">
    <!-- Modern Typography & Visual Assets -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <style>
        :root {
            --bg: #f8fafc;
            --surface: #ffffff;
            --text: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
            --accent: #4f46e5;
            --accent-gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
            --accent-dim: rgba(79, 70, 229, 0.04);
            --error: #ef4444;
            --success: #10b981;
            --radius-lg: 16px;
            --radius-md: 12px;
            --shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
            --shadow-md: 0 10px 25px -5px rgba(79, 70, 229, 0.05), 0 8px 10px -6px rgba(79, 70, 229, 0.05);
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        h1, h2, h3, .block-label, .dropzone p { font-family: 'Plus Jakarta Sans', sans-serif; }
        
        body { 
            background: var(--bg); 
            color: var(--text); 
            padding: clamp(16px, 4vw, 40px) 16px; 
            display: flex; 
            justify-content: center; 
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;
        }
        
        .wrapper { width: 100%; max-width: 900px; display: flex; flex-direction: column; gap: 24px; }
        
        header { 
            display: flex; 
            flex-direction: column; 
            gap: 6px; 
            background: var(--surface);
            padding: 24px;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-sm);
            border: 1px solid var(--border);
        }
        header .brand-wrapper {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        header .logo-icon {
            background: var(--accent-gradient);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.2rem;
            box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
        }
        header h1 { font-size: 1.75rem; font-weight: 800; tracking: -0.02em; color: var(--text); }
        header p { color: var(--text-muted); font-size: 0.9rem; font-weight: 500; display: flex; align-items: center; gap: 8px; margin-top: 2px; }
        header p i { color: var(--accent); }
        
        .grid { display: grid; grid-template-columns: 1fr; gap: 24px; }
        @media(min-width: 768px) { .grid { grid-template-columns: 1.3fr 0.7fr; } }

        .panel {
            background: var(--surface);
            border-radius: var(--radius-lg);
            padding: 24px;
            border: 1px solid var(--border);
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
        }

        .block-label { font-size: 0.85rem; font-weight: 700; color: var(--text); margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; }
        .block-label i { color: var(--text-muted); margin-right: 6px; }
        
        .live-pulse { display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: var(--success); font-size: 0.8rem; background: rgba(16, 185, 129, 0.1); padding: 4px 10px; border-radius: 20px; }
        .live-pulse::before { content: ""; width: 6px; height: 6px; background: var(--success); border-radius: 50%; display: inline-block; animation: pulse 2s infinite; }
        
        @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .textarea-container { position: relative; width: 100%; }
        textarea { 
            width: 100%; 
            height: 380px; 
            background: var(--bg); 
            border: 1px solid var(--border); 
            color: var(--text); 
            padding: 18px; 
            resize: none; 
            font-size: 0.95rem; 
            line-height: 1.6; 
            font-weight: 400; 
            border-radius: var(--radius-md);
            transition: border-color 0.2s ease, box-shadow 0.2s ease; 
        }
        textarea:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); background: var(--surface); }
        
        .dropzone { 
            border: 2px dashed #cbd5e1; 
            background: var(--bg); 
            padding: 32px 16px; 
            text-align: center; 
            cursor: pointer; 
            transition: all 0.2s ease; 
            position: relative; 
            border-radius: var(--radius-md);
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            min-height: 160px; 
        }
        .dropzone:hover { border-color: var(--accent); background: var(--accent-dim); }
        .dropzone i { font-size: 2rem; color: var(--accent); margin-bottom: 12px; }
        .dropzone p { font-size: 0.95rem; font-weight: 600; color: var(--text); }
        .dropzone span { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-top: 4px; }
        input[type="file"] { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
        
        .file-list { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; max-height: 240px; overflow-y: auto; }
        .file-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            background: var(--bg); 
            padding: 12px 16px; 
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            transition: transform 0.15s, box-shadow 0.15s;
        }
        .file-item:hover { transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .file-info { display: flex; align-items: center; gap: 12px; overflow: hidden; width: 75%; }
        .file-info i { color: var(--accent); font-size: 1.1rem; flex-shrink: 0; }
        .file-item a { color: var(--text); text-decoration: none; font-size: 0.9rem; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-item a:hover { color: var(--accent); }
        
        .file-item button { 
            background: #fee2e2; 
            border: none; 
            color: var(--error); 
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer; 
            transition: all 0.15s; 
        }
        .file-item button:hover { background: var(--error); color: white; }
        
        .empty-state { 
            text-align: center; 
            padding: 40px 16px; 
            color: var(--text-muted); 
            font-size: 0.85rem; 
            background: var(--bg); 
            border: 1px dashed var(--border); 
            border-radius: var(--radius-md);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        .empty-state i { font-size: 1.5rem; color: #94a3b8; }

        /* Custom subtle scrollbar for file assets list */
        .file-list::-webkit-scrollbar { width: 6px; }
        .file-list::-webkit-scrollbar-track { background: transparent; }
        .file-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 20px; }
    </style>
</head>
<body>

<div class="wrapper">
    <header>
        <div class="brand-wrapper">
            <div class="logo-icon"><i class="fa-solid fa-rotate"></i></div>
            <div>
                <h1>Local Share</h1>
                <p id="local-ip"><i class="fa-solid fa-network-wired"></i> Local Share: http://192.168.5.3:3000</p>
            </div>
        </div>
    </header>

    <div class="grid">
        <div class="panel">
            <div class="block-label">
                <span><i class="fa-solid fa-align-left"></i> Plaintext Pipeline</span>
                <span class="live-pulse">Active Stream</span>
            </div>
            <div class="textarea-container">
                <textarea id="shared-text" placeholder="Type naturally. Canvas updates in absolute real-time across your grid..."></textarea>
            </div>
        </div>

        <div class="panel">
            <div class="block-label"><span><i class="fa-solid fa-folder-open"></i> Shared Assets</span></div>
            <div class="dropzone">
                <i class="fa-solid fa-cloud-arrow-up"></i>
                <p>Drop file / Tap to attach</p>
                <span>MAX FILE SIZE: 50MB</span>
                <input type="file" id="file-input">
            </div>
            <div class="file-list" id="file-list"></div>
        </div>
    </div>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const socket = io();
    const textarea = document.getElementById('shared-text');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');

    socket.on('init', (data) => {
        textarea.value = data.text;
        renderFiles(data.files);
    });

    socket.on('update-text', (text) => {
        if (document.activeElement !== textarea) {
            textarea.value = text;
        }
    });

    socket.on('update-files', (files) => { renderFiles(files); });

    textarea.addEventListener('input', (e) => {
        socket.emit('text-change', e.target.value);
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) {
            alert("Payload exceeds network capacity limit (50MB).");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            socket.emit('file-upload', {
                name: file.name,
                type: file.type,
                data: event.target.result
            });
            fileInput.value = "";
        };
        reader.readAsDataURL(file);
    });

    function deleteFile(index) { socket.emit('file-delete', index); }

    function renderFiles(files) {
        fileList.innerHTML = "";
        if(files.length === 0) {
            fileList.innerHTML = \`
                <div class="empty-state">
                    <i class="fa-solid fa-box-open"></i>
                    <span>No binary streams currently shared.</span>
                </div>\`;
            return;
        }
        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = \`
                <div class="file-info">
                    <i class="fa-solid fa-file-lines"></i>
                    <a href="\${file.data}" download="\${file.name}">\${file.name}</a>
                </div>
                <button onclick="deleteFile(\${index})" title="Purge Asset"><i class="fa-solid fa-trash-can"></i></button>
            \`;
            fileList.appendChild(item);
        });
    }
</script>
</body>
</html>
    `);
});

io.on('connection', (socket) => {
    socket.emit('init', sharedData);

    socket.on('text-change', (text) => {
        sharedData.text = text;
        socket.broadcast.emit('update-text', text);
    });

    socket.on('file-upload', (fileData) => {
        sharedData.files.push(fileData);
        io.emit('update-files', sharedData.files);
    });

    socket.on('file-delete', (index) => {
        if (sharedData.files[index]) {
            sharedData.files.splice(index, 1);
            io.emit('update-files', sharedData.files);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Local share running on port ${PORT}`);
});
