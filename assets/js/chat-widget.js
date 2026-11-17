/* "Ask about Prabin" chat. Answers come from the facts below, in the browser:
   no server, no API key, nothing sent anywhere, so it can't go offline.
   Keep every answer true to the CV (assets/Prabin_Ayer_CV.pdf). */
(function () {
  const EMAIL = 'ayerprabin95@gmail.com';
  const CV = 'assets/Prabin_Ayer_CV.pdf';

  // [keywords, answer]. The answer with the most keyword hits wins.
  const QA = [
    [['hello', 'hi', 'hey', 'namaste', 'yo'],
      "Hi! Ask me about Prabin's projects, skills, degree, visa, or how to contact him."],
    [['who', 'about', 'yourself', 'summary', 'introduce', 'prabin'],
      "Prabin Ayer is a final-year BSc Computing Science student at Coventry University London (71% First Class average at Level 5), graduating July 2027. He designed, built and runs JD Esports Arena, a live tournament and points-wallet platform with real payments, and funds his degree with hotel, bar and overnight shifts."],
    [['project', 'projects', 'built', 'build', 'portfolio', 'work', 'made'],
      "Main projects: 1) JD Esports Arena (jdesport.co.uk): live tournaments, wallet ledger with row locks, Postgres row-level security, Edge Functions. 2) JD Admin: a small Android app that matches incoming payment notifications to players. 3) jd-ledger: FastAPI + Postgres ledger with idempotency keys, load-tested with k6 (21,781 transfers from 200 concurrent users, 0 errors). See the Computing Science page."],
    [['jd', 'esports', 'arena', 'jdesport', 'tournament', 'platform', 'live', 'players', 'users'],
      "JD Esports Arena (jdesport.co.uk) is live with real players and real payments: tournaments, brackets, a points wallet, chat and an admin app. Built on Supabase/Postgres with row-level security, SECURITY DEFINER functions and Deno Edge Functions. There's a design doc, post-mortem and load test linked on the Computing Science page."],
    [['ledger', 'wallet', 'payment', 'payments', 'money', 'idempotency', 'lock', 'concurrency', 'load', 'k6'],
      "The arena wallet uses row locks (SELECT FOR UPDATE), conditional updates and a balance >= 0 check, so balances can't go negative under concurrent spending. The separate jd-ledger project adds idempotency keys and ordered locks; its k6 load test ran 21,781 transfers from 200 concurrent users with 0 errors and every invariant held."],
    [['incident', 'postmortem', 'post-mortem', 'outage', 'egress', 'failure', 'mistake'],
      "In November 2026 the arena hit its database egress limit and was blocked. Prabin found the cause (heavy polling and large payloads), cut traffic, added limits, and wrote a public post-mortem. It's linked on the Computing Science page."],
    [['skill', 'skills', 'stack', 'language', 'languages', 'tech', 'technologies', 'python', 'java', 'sql', 'javascript', 'typescript'],
      "Skills: Python, Java (Android), JavaScript/TypeScript, SQL. Postgres, Supabase, FastAPI, Deno Edge Functions, Git and GitHub Actions, k6 load testing. Plus customer-facing work under pressure from years of hospitality."],
    [['degree', 'university', 'uni', 'study', 'grade', 'grades', 'coventry', 'education', 'first'],
      "BSc Computing Science at Coventry University London. 71% First Class average at Level 5. Graduating July 2027."],
    [['visa', 'sponsor', 'sponsorship', 'right', 'permit', 'immigration'],
      "Prabin is on a UK Student visa until graduation (July 2027). After that he will need Skilled Worker sponsorship."],
    [['available', 'start', 'when', 'availability', 'notice', 'graduate', 'role', 'job', 'hire', 'hiring', 'looking', 'open'],
      "He's looking for graduate or junior software engineering roles (backend, data or full stack), full time from August 2027. Happy to relocate anywhere in the UK."],
    [['location', 'where', 'based', 'london', 'relocate', 'remote'],
      "Based in London and happy to relocate anywhere in the UK."],
    [['hospitality', 'hotel', 'bar', 'restaurant', 'shift', 'shifts', 'job', 'experience'],
      "Alongside the degree he works hotel, bar and overnight shifts in London, which pays for his studies. The Hospitality page has the details."],
    [['cv', 'resume', 'rÃ©sumÃ©', 'download', 'pdf'],
      'You can download his one-page CV here: ' + location.origin + location.pathname.replace(/[^/]*$/, '') + CV],
    [['contact', 'email', 'reach', 'touch', 'phone', 'call', 'linkedin', 'message', 'interview'],
      'Email ' + EMAIL + ' or connect on LinkedIn (linkedin.com/in/ayerprabin). The Contact page has everything a recruiter needs.'],
    [['github', 'code', 'repo', 'repos', 'source'],
      'His code is on GitHub: github.com/AyerPrabin'],
  ];
  const FALLBACK = "I can answer questions about Prabin's projects, skills, degree, visa and availability. For anything else, email " + EMAIL + '.';
  const SUGGEST = ['What has he built?', 'Does he need sponsorship?', 'When can he start?', 'Download CV'];

  function answer(q) {
    const words = q.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(Boolean);
    let best = null, score = 0;
    for (const [keys, a] of QA) {
      const s = keys.reduce((n, k) => n + (words.includes(k) ? 1 : 0), 0);
      if (s > score) { score = s; best = a; }
    }
    return best || FALLBACK;
  }

  const html = `
    <button class="chat-launcher" id="chat-launcher" aria-label="Ask about Prabin" aria-expanded="false" aria-controls="chat-panel">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    </button>
    <div class="chat-panel" id="chat-panel" role="dialog" aria-label="Ask about Prabin">
      <div class="chat-head">
        <div>
          <div class="chat-head-t">Ask about Prabin</div>
          <div class="chat-head-sub">Instant answers from his CV</div>
        </div>
        <button class="chat-close" id="chat-close" aria-label="Close chat">&times;</button>
      </div>
      <div class="chat-body" id="chat-body" aria-live="polite">
        <div class="chat-msg hint">Ask about his projects, skills, visa, or how to get in touch.</div>
        <div class="chat-sugg" id="chat-sugg"></div>
      </div>
      <form class="chat-form" id="chat-form">
        <input class="chat-input" id="chat-input" placeholder="Type a question..." autocomplete="off" maxlength="300" aria-label="Your question">
        <button class="chat-send" id="chat-send" type="submit">Send</button>
      </form>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  if (!document.getElementById('chat-sugg-css')) {
    const st = document.createElement('style');
    st.id = 'chat-sugg-css';
    st.textContent = '.chat-sugg{display:flex;flex-wrap:wrap;gap:.4rem;margin:.2rem 0 .6rem}.chat-sugg button{font:inherit;font-size:.78rem;padding:.35rem .7rem;border-radius:999px;border:1px solid var(--gold-m,#8a6d3b);background:transparent;color:var(--cream,#eee);cursor:pointer}.chat-sugg button:hover,.chat-sugg button:focus-visible{border-color:var(--gold-l,#d4b26a);outline:none}';
    document.head.appendChild(st);
  }

  const launcher = document.getElementById('chat-launcher');
  const panel = document.getElementById('chat-panel');
  const body = document.getElementById('chat-body');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const sugg = document.getElementById('chat-sugg');

  function addMsg(text, cls) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + cls;
    div.textContent = text;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
  }
  function ask(q) {
    addMsg(q, 'user');
    setTimeout(() => addMsg(answer(q), 'bot'), 250);
  }
  SUGGEST.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = s;
    b.addEventListener('click', () => ask(s));
    sugg.appendChild(b);
  });

  function setOpen(open) {
    panel.classList.toggle('open', open);
    launcher.setAttribute('aria-expanded', String(open));
    if (open) input.focus();
  }
  launcher.addEventListener('click', () => setOpen(!panel.classList.contains('open')));
  document.getElementById('chat-close').addEventListener('click', () => setOpen(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = '';
    ask(q);
  });
})();
