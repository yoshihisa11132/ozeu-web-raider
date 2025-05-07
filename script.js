const logEl = document.getElementById('log');
const x_super_properties = "eyJvcyI6IldpbmRvd3MiLCJicm93c2VyIjoiQ2hyb21lIiwiZGV2aWNlIjoiIiwic3lzdGVtX2xvY2FsZSI6ImVuLVVTIiwiaGFzX2NsaWVudF9tb2RzIjpmYWxzZSwiYnJvd3Nlcl91c2VyX2FnZW50IjoiTW96aWxsYS81LjAgKFdpbmRvd3MgTlQgMTAuMDsgV2luNjQ7IHg2NCkgQXBwbGVXZWJLaXQvNTM3LjM2IChLSFRNTCwgbGlrZSBHZWNrbykgQ2hyb21lLzEzNC4wLjAuMCBTYWZhcmkvNTM3LjM2IiwiYnJvd3Nlcl92ZXJzaW9uIjoiMTM0LjAuMC4wIiwib3NfdmVyc2lvbiI6IjEwIiwicmVmZXJyZXIiOiJodHRwczovL2Rpc2NvcmQuY29tIiwicmVmZXJyaW5nX2RvbWFpbiI6ImRpc2NvcmQuY29tIiwicmVmZXJyZXJfY3VycmVudCI6IiIsInJlZmVycmluZ19kb21haW5fY3VycmVudCI6IiIsInJlbGVhc2VfY2hhbm5lbCI6InN0YWJsZSIsImNsaWVudF9idWlsZF9udW1iZXIiOjM4NDg4NywiY2xpZW50X2V2ZW50X3NvdXJjZSI6bnVsbH0=";

// ログ出力: タイムスタンプ付きで表示＆スクロール
function appendLog(text) {
  const time = new Date().toLocaleTimeString();
  logEl.textContent += `\n${time} - ${text}`;
  logEl.scrollTop = logEl.scrollHeight;
}

// ログクリア
function clearLog() {
  logEl.textContent = '';
}

// スパム停止フラグ
let shouldStopSpam = false;


const tokensInput       = document.getElementById('tokens');
const guildInput        = document.getElementById('guildId');
const channelInput      = document.getElementById('channelIds');

const randomizeCheckbox = document.getElementById('randomize');
const allmentionCheckbox = document.getElementById('allmention');
const delayInput        = document.getElementById('delay');
const limitInput        = document.getElementById('limit');
const mentionInput      = document.getElementById('mentionIds');
const pollTitleInput    = document.getElementById('pollTitle');
const pollAnswersInput  = document.getElementById('pollAnswers');
const autoFillBtn       = document.getElementById('autoFillChannels');
const fetchMentionsBtn  = document.getElementById('fetchMentions');
const submitBtn         = document.getElementById('submitBtn');
const stopBtn           = document.getElementById('stopSpam');
const leaveBtn          = document.getElementById('leaveBtn');
const form              = document.getElementById('form');


function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 入力文字列をカンマまたは改行で分割し、空要素・重複を排除する
function parseList(input) {
  const arr = input.split(/[\s,]+/)
    .map(s => s.trim())
    .filter(s => s);
  return [...new Set(arr)];
}

async function leaveGuild(token, guildId) {
	const res = await fetch(`https://discord.com/api/v9/users/@me/guilds/${guildId}`, {
		method: 'DELETE',
		headers: { 'Authorization': token , 'Content-Type': 'application/json' , 'x-super-properties': x_super_properties },
    referrerPolicy: "no-referrer"
	});
	if (res.status === 204) appendLog(`✅ 退出成功: ${token.slice(0, 10)}*****`);
	else appendLog(`❌ ${token.slice(0, 10)}***** - 退出失敗(${JSON.stringify(await res.json())})`);
}

// チャンネル自動取得
autoFillBtn.addEventListener('click', async () => {
  clearLog();
  const tokens = parseList(tokensInput.value);
  const guildId = guildInput.value.trim();
  if (!tokens.length) return appendLog('⚠️ トークンを入力してください');
  if (!guildId)    return appendLog('⚠️ サーバーIDを入力してください');
  try {
    const res = await fetch(`https://discord.com/api/v9/guilds/${guildId}/channels`, { headers: { Authorization: tokens[0], 'Content-Type': 'application/json' , 'x-super-properties': x_super_properties }, referrerPolicy: "no-referrer" });
    if (!res.ok) throw new Error(JSON.stringify(await res.json()));
    const data = await res.json();
    const ids  = data.filter(ch => ch.type === 0).map(ch => ch.id);
    if (!ids.length) return appendLog('チャンネルが見つかりません');
    channelInput.value = ids.join(',');
    appendLog('✅ チャンネル取得完了');
  } catch (e) {
    appendLog(`❌ ${token.slice(0, 10)}***** - エラー：${e.message}`);
  }
});

// メンション取得
fetchMentionsBtn.addEventListener('click', async () => {
  clearLog();
  const tokens     = parseList(tokensInput.value);
  const guildId    = guildInput.value.trim();
  const channelIds = parseList(channelInput.value);
  if (!tokens.length)    return appendLog('⚠️ トークンを入力してください');
  if (!guildId)         return appendLog('⚠️ サーバーIDを入力してください');
  if (!channelIds.length) return appendLog('⚠️ チャンネルIDを入力してください');
  const ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json');
  ws.onopen = () => {
    ws.send(JSON.stringify({ op: 2, d: { token: tokens[0], properties: { os: 'Windows', browser: 'Discord', device: 'pc' }, intents: 1 << 12 } }));
  };
  ws.onmessage = event => {
    const msg = JSON.parse(event.data);
    if (msg.op === 0 && msg.t === 'READY') {
      ws.send(JSON.stringify({ op: 14, d: { guild_id: guildId, typing: false, activities: false, threads: true, channels: { [channelIds[0]]: [[0, 0]] } } }));
    }
    if (msg.t === 'GUILD_MEMBER_LIST_UPDATE') {
      const mentions = msg.d.ops[0].items.filter(i => i.member).map(i => i.member.user.id);
      if (mentions.length) { mentionInput.value = mentions.join(','); appendLog('✅ メンション取得完了'); }
      else appendLog('メンションが見つかりません');
      ws.close();
    }
  };
  ws.onerror = () => { appendLog('❌ WebSocketエラー'); ws.close(); };
});

// メッセージ送信
async function sendMessage(token, channelId, content, opts = {}) {
    const headers = { 'Authorization': token, 'Content-Type': 'application/json', 'x-super-properties': x_super_properties };
    let body = { content: content || '' };
    if (opts.randomize) body.content += `\n${crypto.randomUUID()}`;
    if (opts.allmention) body.content = `@everyone\n${body.content}`;
    if (opts.randomMentions) {
      const id = opts.randomMentions[Math.floor(Math.random() * opts.randomMentions.length)];
      body.content = `<@${id}>\n${body.content}`;
    }
    if (opts.pollTitle && opts.pollAnswers) body.poll = { question: { text: opts.pollTitle }, answers: opts.pollAnswers.map(a => ({ poll_media: { text: a.trim() } })), allow_multiselect: false, duration: 1, layout_type: 1 };
  
    const res = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, { method: 'POST', headers, body: JSON.stringify(body), referrerPolicy: "no-referrer" });
    return res;  // レスポンスを返す
}

// 再試行ロジックを外で実行
async function sendMessageWithRetry(token, channelId, content, opts = {}, maxRetries = 5, delayTime = 3000) {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            const res = await sendMessage(token, channelId, content, opts);
            if (res.ok) {
                appendLog(`✅ ${token.slice(0, 10)}***** - メッセージ送信成功`);
                return true; // 成功した場合、trueを返す
            } else if (res.status === 429) {
                // レート制限の場合、レスポンスのretry_afterを取得して待機
                const jd = await res.json();
                const wait = (jd?.retry_after || 1) * 1000;
                appendLog(`⏳  ${token.slice(0, 10)}***** - レート制限: ${wait / 1000}s`);
                await sleep(wait);  // スリープ
                attempt++;  // リトライ回数を増やす
            } else {
                const errorData = await res.json();  // エラーレスポンスを取得
                appendLog(`❌ ${token.slice(0, 10)}***** - 送信エラー(${res.status}): ${JSON.stringify(errorData) || '詳細不明'}`);
                return false;  // エラーが発生した場合、falseを返す
            }
        } catch (e) {
            appendLog(`⚠️ ${token.slice(0, 10)}***** - エラー: ${e.message} | 再試行中...`);
            await sleep(delayTime);  // スリープ
            attempt++;
        }
    }
    appendLog(`❌ トークン(${token.slice(0, 10)}) 最大リトライ回数に達しました。`);
    return false;
}

// 入力が未入力の場合、ボタンを無効化
function checkFormValidity() {
  const tokens = tokensInput.value.trim();
  const guildId = guildInput.value.trim();
  //const message = messageInput.value.trim();
  submitBtn.disabled = !(tokens && guildId);
}

// 入力フィールドの変更時にチェック
tokensInput.addEventListener('input', checkFormValidity);
guildInput.addEventListener('input', checkFormValidity);
//messageInput.addEventListener('input', checkFormValidity);

// 初期状態でフォームの有効性をチェック
checkFormValidity();

// スパム実行
form.addEventListener('submit', async e => {
    e.preventDefault();
    const messageInput      = document.querySelector('input[name="messageOption"]:checked');
    // メッセージがAの場合
    let message;
    if (messageInput.value === 'A') {
        message = `# RAID by OZEU. join now
# ozeu on top
https://discord.gg/ozeu-x`
    }
    else if (messageInput.value === 'B') {
        message = `# おぜうの集いに今すぐ参加！
## https://\/\/\ｃ͏a͏ｎ͏a͏ｒ͏ｙ͏。͏𝑑͏𝓲͏Ｓ͏𝐜͏𝑜͏ｒ͏ᵈ͏Ａ͏pＰ͏。͏𝐜͏𝑜͏ｍ͏\google.com⁂⌘∮/%2e.\../%69%6e%76%69%74%65\youtube.com‖∠∇\../\../\../white_check_marktwitter.com]「＠\../\../\../\../hK5He8z8Ge
-# [gif](https://𝕚͏𝕞͏𝕘͏𝕦͏𝕣͏.͏𝕔͏𝕠͏𝕞͏/yNx4Me2)
-# [gif](https://𝗺͏𝗲͏𝗱͏𝗶͏𝗮͏.͏𝗱͏𝗶͏𝘀͏𝗰͏𝗼͏𝗿͏𝗱͏𝗮͏𝗽͏𝗽͏.͏𝗻͏𝗲͏𝘁͏/attachments/1341829977850646668/1353001058405978172/IMB_DZBN6p.gif?ex=67e00fed&is=67debe6d&hm=b07d1cf915c35fa1871b655f91d3738eba09ea05683a1abf5b883b0598f3b92a&)
-# [gif](https://𝕚͏𝕞͏𝕘͏𝕦͏𝕣͏.͏𝕔͏𝕠͏𝕞͏/NbBGFcf.mp4)
|| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| |||| ||`
    }
    else if (messageInput.value === 'C') {
        message = `https://x.gd/EFvvP`
    }
    if (!message) {
        appendLog('⚠️ メッセージ内容が入力されていません');
        return;  // 処理を終了
    }

    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.textContent = '実行中...';
    shouldStopSpam = false;
    stopBtn.disabled = false;
  
    const tokens      = parseList(tokensInput.value);
    const guildId     = guildInput.value.trim();
    const channelIds  = parseList(channelInput.value);
    const randomize   = randomizeCheckbox.checked;
    const allmention  = allmentionCheckbox.checked;
    const delay       = parseFloat(delayInput.value) || 0;
    const limit       = limitInput.value.trim() ? parseInt(limitInput.value) : Infinity;
    const mentionArr  = mentionInput.value.trim() ? parseList(mentionInput.value) : null;
    const pollTitle   = pollTitleInput.value.trim() || null;
    const pollAnswers = pollAnswersInput.value.trim() ? parseList(pollAnswersInput.value) : null;
  
    let totalCount = 0;
  
    // トークンごとにメッセージ送信タスクを実行
    const tasks = tokens.map(token => {
      return async () => {
        let channelIndex = 0;
        
        // トークンごとに、メッセージ送信を続ける
        while (!shouldStopSpam && totalCount < limit) {
          // チャンネルの数が限られているので、全てのチャンネルに送信後ループを抜けないように
          if (channelIndex >= channelIds.length) {
            channelIndex = 0; // チャンネルを最初から再送信する
          }
          
          const channelId = channelIds[channelIndex];
          channelIndex++; // 次のチャンネルへ
          
          const success = await sendMessageWithRetry(token, channelId, message, { randomize, randomMentions: mentionArr, pollTitle, pollAnswers, allmention });
          
          if (success) totalCount++;  // 送信成功時にカウントを増加
          if (totalCount >= limit) {
            appendLog('✅ 指定数に達しました');
            break;  // 指定回数に達したら終了
          }
  
          if (delay) { 
            //appendLog(`⏱ ディレイ ${delay}秒`); 
            await sleep(delay * 1000); 
          }
        }
      };
    });
  
    // 各トークンについて並列でタスクを実行
    await Promise.all(tasks.map(task => task()));
  
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    stopBtn.disabled = true;
    submitBtn.textContent = '実行';
    appendLog('✅ 完了');
});


// 停止ボタンリスナー
stopBtn.addEventListener('click', () => {
  shouldStopSpam = true;
  appendLog('🛑 スパムを停止します...')
  submitBtn.disabled = false; submitBtn.classList.remove('loading') ; submitBtn.textContent = '実行';
});

// 退出ボタンリスナー
leaveBtn.addEventListener('click', async () => {
  shouldStopSpam = true; stopBtn.disabled = true; appendLog('🛑 スパムを停止します...');
  const tokens  = parseList(tokensInput.value);
  const guildId = guildInput.value.trim();
  if (!tokens.length) return appendLog('⚠️ トークンを入力してください');
  if (!guildId) return appendLog('⚠️ サーバーIDを入力してください');
  for (const token of tokens) await leaveGuild(token, guildId);
  appendLog('✅ 退出処理完了');
  submitBtn.disabled = false; submitBtn.classList.remove('loading') ; submitBtn.textContent = '実行';
});
