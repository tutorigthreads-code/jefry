const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// BOT TOKEN (nanti diganti via environment variable)
const BOT_TOKEN = process.env.BOT_TOKEN;
const TOKEN_FILE = 'tokens.json';

// Load tokens
function loadTokens() {
    try {
        const data = fs.readFileSync(TOKEN_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

// Save tokens
function saveTokens(tokens) {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
}

// Init bot
const bot = new Telegraf(BOT_TOKEN);

// Command /start
bot.start((ctx) => {
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('➕ ADD TOKEN', 'add')],
        [Markup.button.callback('🗑️ HAPUS TOKEN', 'delete')],
        [Markup.button.callback('📋 LIST TOKEN', 'list')]
    ]);
    
    ctx.reply('🔰 *BOT MANAGER TOKEN*\nPilih menu:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
});

// Handle add token
bot.action('add', (ctx) => {
    ctx.session = ctx.session || {};
    ctx.session.waitingFor = 'add';
    ctx.editMessageText('📝 Kirim token yang mau ditambahkan:');
});

// Handle list token
bot.action('list', (ctx) => {
    const tokens = loadTokens();
    
    if (tokens.length === 0) {
        return ctx.editMessageText('📭 Belum ada token!');
    }
    
    let msg = '📋 *Daftar Token:*\n';
    tokens.forEach((t, i) => {
        msg += `\n${i+1}. \`${t.substring(0, 15)}...\``;
    });
    
    ctx.editMessageText(msg, { parse_mode: 'Markdown' });
});

// Handle delete token
bot.action('delete', (ctx) => {
    const tokens = loadTokens();
    
    if (tokens.length === 0) {
        return ctx.editMessageText('❌ Tidak ada token!');
    }
    
    const buttons = tokens.map((t, i) => {
        return [Markup.button.callback(
            `❌ ${t.substring(0, 10)}...`, 
            `del_${i}`
        )];
    });
    
    buttons.push([Markup.button.callback('🔙 Kembali', 'back')]);
    
    ctx.editMessageText('🗑️ Pilih token yang mau dihapus:', 
        Markup.inlineKeyboard(buttons)
    );
});

// Handle delete specific
bot.action(/del_(\d+)/, (ctx) => {
    const index = parseInt(ctx.match[1]);
    let tokens = loadTokens();
    
    if (index >= 0 && index < tokens.length) {
        tokens.splice(index, 1);
        saveTokens(tokens);
        ctx.editMessageText('✅ Token berhasil dihapus!');
    }
});

// Handle back
bot.action('back', (ctx) => {
    const keyboard = Markup.inlineKeyboard([
        [Markup.button.callback('➕ ADD TOKEN', 'add')],
        [Markup.button.callback('🗑️ HAPUS TOKEN', 'delete')],
        [Markup.button.callback('📋 LIST TOKEN', 'list')]
    ]);
    
    ctx.editMessageText('🔰 *BOT MANAGER TOKEN*\nPilih menu:', {
        parse_mode: 'Markdown',
        ...keyboard
    });
});

// Handle text message
bot.on('text', (ctx) => {
    ctx.session = ctx.session || {};
    
    if (ctx.session.waitingFor === 'add') {
        const token = ctx.message.text.trim();
        
        if (!token.includes(':')) {
            return ctx.reply('❌ Format token salah! Harus mengandung ":"');
        }
        
        let tokens = loadTokens();
        
        if (tokens.includes(token)) {
            return ctx.reply('⚠️ Token sudah ada di database!');
        }
        
        tokens.push(token);
        saveTokens(tokens);
        
        ctx.session.waitingFor = null;
        ctx.reply('✅ Token berhasil ditambahkan!');
    }
});

// Cek token
if (!BOT_TOKEN) {
    console.error('❌ BOT_TOKEN tidak ditemukan di environment!');
    process.exit(1);
}

// Jalankan bot
console.log('🚀 Bot started...');
bot.launch();

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
