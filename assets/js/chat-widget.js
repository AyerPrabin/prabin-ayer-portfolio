/* AI chat widget — calls zulu_server.py's /portfolio endpoint (same server/pattern as
   the ZULU chat on jdesport.co.uk). Self-contained: injects its own launcher + panel
   markup so every page only needs one <script> tag, no HTML duplication across pages.

   OPTIONAL: this is a cloudflared quick-tunnel URL — it changes every time
   zulu_server.py/cloudflared restart on Prabin's PC. If the widget stops answering,
   re-run cloudflared and paste the new URL here. Leave '' to hide the widget entirely
   rather than show a chat that can't reach anything. */
const PORTFOLIO_AI_URL = 'https://episodes-proceedings-remember-contrary.trycloudflare.com';

(function () {
  if (!PORTFOLIO_AI_URL) return;

  const html = `
    <button class="chat-launcher" id="chat-launcher" aria-label="Chat with AI assistant">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    </button>
    <div class="chat-panel" id="chat-panel">
      <div class="chat-head">
        <div>
          <div class="chat-head-t">Ask about Prabin</div>
          <div class="chat-head-sub">AI Assistant</div>
        </div>
        <button class="chat-close" id="chat-close" aria-label="Close chat">&times;</button>
      </div>
      <div class="chat-body" id="chat-body">
        <div class="chat-msg hint">Ask about his projects, skills, or how to get in touch.</div>
      </div>
      <form class="chat-form" id="chat-form">
        <input class="chat-input" id="chat-input" placeholder="Type a message..." autocomplete="off" maxlength="500">
        <button class="chat-send" id="chat-send" type="submit">Send</button>
      </form>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);

  const launcher = document.getElementById('chat-launcher');
  const panel = document.getElementById('chat-panel');
  const closeBtn = document.getElementById('chat-close');
  const body = document.getElementById('chat-body');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const send = document.getElementById('chat-send');

  function addMsg(text, cls) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + cls;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }

  launcher.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) input.focus();
  });
  closeBtn.addEventListener('click', () => panel.classList.remove('open'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    addMsg(message, 'user');
    input.value = '';
    send.disabled = true;
    try {
      const res = await fetch(PORTFOLIO_AI_URL + '/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.reply) {
        addMsg(data.reply, 'bot');
      } else {
        addMsg("AI assistant's offline right now — reach Prabin directly: ayerprabin95@gmail.com", 'hint');
      }
    } catch {
      addMsg("AI assistant's offline right now — reach Prabin directly: ayerprabin95@gmail.com", 'hint');
    } finally {
      send.disabled = false;
    }
  });
})();
