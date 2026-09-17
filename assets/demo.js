(() => {
  const demo = document.getElementById('product-demo');
  if (!demo) return;

  const panelBody = demo.querySelector('.cm-body');
  const tabs = [...demo.querySelectorAll('.cm-tab')];
  const subTabs = demo.querySelector('.cm-subtabs');
  const status = demo.querySelector('.demo-status');
  const progress = [...demo.querySelectorAll('.demo-progress i')];
  const cursor = demo.querySelector('.cursor');
  const arrow = cursor.querySelector('.arrow');
  const hand = cursor.querySelector('.hand');
  const chatTitle = demo.querySelector('.chat-title');
  const sideChatTitle = demo.querySelector('.chat-title-side');
  const contextTitle = demo.querySelector('.cm-context-title');
  const userMsg = demo.querySelector('.message.user');
  const assistantMsg = demo.querySelector('.message.assistant p');
  const secondUser = demo.querySelector('.second-user');
  const secondAssistant = demo.querySelector('.second-assistant p');
  const composerText = demo.querySelector('.composer-text');
  const chatScreen = demo.querySelector('[data-demo-screen="chatgpt"]');
  const workspaceScreen = demo.querySelector('[data-demo-screen="workspace"]');
  const chromeTabs = [...demo.querySelectorAll('[data-browser-tab]')];

  let timers = [];
  let running = true;

  const chats = {
    launch: {
      title: 'Website launch plan',
      user: 'We need a lean launch plan for ChatMargin. What should we prioritize first?',
      assistant: 'Start with Chrome and Chromium, focus on heavy ChatGPT users, and learn from the first active users before expanding.',
      user2: 'Good. Turn that into concrete actions and track what remains open.',
      assistant2: '<strong>Actions:</strong> tighten onboarding, instrument feedback, interview users and publish a local-first trust page.<br><br><strong>Risk:</strong> adding too many features before the core workflow is obvious.'
    },
    research: {
      title: 'User interview synthesis',
      user: 'What patterns are emerging from the first user interviews?',
      assistant: 'Users value continuity most: notes beside the chat, faster prompt reuse and an obvious way to return to unfinished conversations.',
      user2: 'Turn those signals into product priorities.',
      assistant2: '<strong>Priorities:</strong> improve notes, simplify prompt reuse, make follow-up visible and keep local-first trust explicit.'
    },
    seo: {
      title: 'SEO content plan',
      user: 'What questions should the website answer for people searching for a better ChatGPT workflow?',
      assistant: 'Answer concrete needs: taking notes beside ChatGPT, saving prompts, organizing unfinished chats and opening a larger workspace.',
      user2: 'Keep it useful, not keyword-stuffed.',
      assistant2: '<strong>Approach:</strong> publish focused guides, concise FAQs, clear product limits and direct links to the Chrome Web Store.'
    }
  };

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  };
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function setCursor(x, y, clicking = false, dragging = false) {
    cursor.style.transform = `translate(${x}px, ${y}px)`;
    arrow.style.display = clicking || dragging ? 'none' : 'block';
    hand.style.display = clicking || dragging ? 'block' : 'none';
    cursor.classList.toggle('clicking', clicking);
    cursor.classList.toggle('dragging', dragging);
  }
  function clickPulse() {
    cursor.classList.add('tap');
    later(() => cursor.classList.remove('tap'), 260);
  }
  function setProgress(index) { progress.forEach((el, i) => el.classList.toggle('active', i === index)); }
  function setTab(name) {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.demoTab === name));
    subTabs.hidden = name !== 'notes';
  }
  function setChat(key) {
    const c = chats[key];
    chatTitle.textContent = c.title;
    sideChatTitle.textContent = c.title;
    contextTitle.textContent = c.title;
    userMsg.textContent = c.user;
    assistantMsg.textContent = c.assistant;
    secondUser.textContent = c.user2;
    secondAssistant.innerHTML = c.assistant2;
  }

  function notesHtml(step = 0) {
    return `<div class="note-page">
      <div class="note-toolbar ${step >= 1 ? 'visible' : ''}"><button><strong>B</strong></button><button>H1</button><button>H2</button><button>• List</button><button>☑ To-do</button><button>↗ Link</button></div>
      <div class="note-editor">
        <h3 class="note-heading ${step >= 2 ? 'formatted' : ''}">${step >= 2 ? 'Launch decisions' : 'Launch notes'}</h3>
        <p class="note-copy">Keep the launch simple and learn from real use.</p>
        <p class="imported ${step >= 1 ? 'show' : ''}"><strong>Start with Chrome and Chromium</strong>, focus on heavy ChatGPT users, and learn from the first active users before expanding.</p>
        <ul class="note-list ${step >= 3 ? 'show' : ''}"><li>Refresh onboarding</li><li>Publish local-first trust messaging</li><li>Interview active users</li></ul>
        <div class="checklist ${step >= 4 ? 'show' : ''}"><label><input type="checkbox" checked /> Website positioning refreshed</label><label><input type="checkbox" /> Interview active users</label></div>
      </div>
    </div>`;
  }

  function promptsHtml(order = ['Launch summary', 'Turn notes into actions', 'Find open questions'], highlight = '') {
    return `<div class="prompt-list">${order.map((name, i) => `<div class="prompt-card ${highlight === name ? 'dragging-card' : ''}"><div class="drag-handle">⋮⋮</div><div><strong>${name}</strong><span>${i === 0 ? 'Summarize this conversation into decisions and next steps.' : i === 1 ? 'Turn these notes into a short action list.' : 'List the unresolved questions in this chat.'}</span></div><button class="send-prompt">Send to ChatGPT</button></div>`).join('')}</div>`;
  }

  function dashboardHtml() {
    return `<div class="dashboard-demo"><div class="dash-filters"><button class="active">All</button><button>High priority</button><button>Product launch</button></div>
      <button class="dash-row"><span class="dot high"></span><div><strong>User interview synthesis</strong><span>High priority · Follow-up</span></div></button>
      <button class="dash-row"><span class="dot medium"></span><div><strong>SEO content plan</strong><span>Medium priority · Follow-up</span></div></button>
      <button class="dash-row"><span class="dot low"></span><div><strong>Website launch plan</strong><span>Low priority · Open</span></div></button></div>`;
  }

  function searchHtml(query = '') {
    return `<div class="search-demo"><div class="search-box"><span>⌕</span><span class="query">${query || 'Search notes, prompts and conversations...'}</span></div>${query ? `<div class="search-results"><button><small>CONVERSATION</small><strong>SEO content plan</strong><span>Questions people ask about ChatGPT workflow...</span></button><button><small>NOTE</small><strong>Launch decisions</strong><span>Publish local-first trust messaging...</span></button><button><small>PROMPT</small><strong>Find open questions</strong><span>List the unresolved questions in this chat.</span></button></div>` : ''}</div>`;
  }

  function showWorkspace() {
    chatScreen.hidden = true;
    workspaceScreen.hidden = false;
    chromeTabs.forEach(t => t.classList.toggle('active', t.dataset.browserTab === 'workspace'));
  }
  function showChat() {
    workspaceScreen.hidden = true;
    chatScreen.hidden = false;
    chromeTabs.forEach(t => t.classList.toggle('active', t.dataset.browserTab === 'chatgpt'));
  }

  function resetVisuals() {
    showChat();
    setChat('launch');
    composerText.textContent = 'Ask anything';
    composerText.classList.remove('filled');
    panelBody.innerHTML = notesHtml(0);
    setTab('notes');
    setCursor(485, 250);
  }

  function runNotes() {
    setProgress(0); setTab('notes'); setChat('launch'); panelBody.innerHTML = notesHtml(0);
    status.textContent = 'Notes: capture, format and structure context beside the chat.';
    setCursor(190, 245);
    later(() => { assistantMsg.classList.add('selected-text'); setCursor(260, 245, false, true); }, 1000);
    later(() => { panelBody.innerHTML = notesHtml(1); assistantMsg.classList.remove('selected-text'); setCursor(715, 276, true); clickPulse(); }, 2500);
    later(() => { panelBody.innerHTML = notesHtml(2); setCursor(695, 205, true); clickPulse(); }, 4200);
    later(() => { panelBody.innerHTML = notesHtml(3); setCursor(760, 205, true); clickPulse(); }, 5800);
    later(() => { panelBody.innerHTML = notesHtml(4); setCursor(812, 205, true); clickPulse(); }, 7400);
    later(() => {
      const add = demo.querySelector('.add-subpage'); add.classList.add('pulse-control'); setCursor(902, 171, true); clickPulse();
      later(() => { add.classList.remove('pulse-control'); const btn = demo.querySelector('.subpage-btn'); btn.textContent = 'Launch checklist'; btn.classList.add('active'); demo.querySelector('.cm-subtabs > button:first-child').classList.remove('active'); }, 450);
    }, 9000);
    later(() => { setCursor(880, 58, true); clickPulse(); status.textContent = 'Workspace: open the same note in a larger writing surface.'; showWorkspace(); }, 10800);
    later(() => { showChat(); status.textContent = 'Notes: capture, format and structure context beside the chat.'; }, 13200);
    later(runPrompts, 14500);
  }

  function runPrompts() {
    setProgress(1); setTab('prompts'); panelBody.innerHTML = promptsHtml();
    status.textContent = 'Prompts: reuse, insert and reorder the prompts you actually use.';
    setCursor(700, 126, true); clickPulse();
    later(() => { setCursor(905, 250, true); clickPulse(); composerText.textContent = 'Summarize this conversation into decisions and next steps.'; composerText.classList.add('filled'); }, 1700);
    later(() => { setCursor(692, 323, false, true); panelBody.innerHTML = promptsHtml(['Launch summary', 'Turn notes into actions', 'Find open questions'], 'Turn notes into actions'); }, 3600);
    later(() => { panelBody.innerHTML = promptsHtml(['Turn notes into actions', 'Launch summary', 'Find open questions']); setCursor(692, 245, true); clickPulse(); }, 5100);
    later(() => { const first = panelBody.querySelector('.prompt-card'); first.classList.toggle('collapsed'); }, 6800);
    later(runDashboard, 8300);
  }

  function runDashboard() {
    setProgress(2); setTab('dashboard'); panelBody.innerHTML = dashboardHtml();
    status.textContent = 'Dashboard: return to unfinished conversations by priority and project.';
    setCursor(812, 126, true); clickPulse();
    later(() => { const buttons = panelBody.querySelectorAll('.dash-filters button'); buttons[1].classList.add('active'); buttons[0].classList.remove('active'); setCursor(760, 205, true); clickPulse(); }, 1700);
    later(() => { setCursor(805, 276, true); clickPulse(); setChat('research'); }, 3500);
    later(() => { setCursor(808, 332, true); clickPulse(); setChat('seo'); }, 5500);
    later(runSearch, 7400);
  }

  function runSearch() {
    setProgress(3); setTab('search'); panelBody.innerHTML = searchHtml('');
    status.textContent = 'Search: find conversations, notes and prompts from one place.';
    setCursor(912, 126, true); clickPulse();
    later(() => { panelBody.innerHTML = searchHtml('local-first'); setCursor(760, 206, true); clickPulse(); }, 1700);
    later(() => { const result = panelBody.querySelector('.search-results button'); result.classList.add('selected-result'); setCursor(780, 277, true); clickPulse(); setChat('seo'); }, 3700);
    later(() => { if (running) runNotes(); }, 6200);
  }

  function startFromScene(scene) {
    clearTimers(); running = true;
    if (scene === 'notes') runNotes();
    if (scene === 'prompts') runPrompts();
    if (scene === 'dashboard') runDashboard();
    if (scene === 'search') runSearch();
  }

  tabs.forEach(tab => tab.addEventListener('click', () => startFromScene(tab.dataset.demoTab)));
  demo.querySelectorAll('[data-open-workspace]').forEach(btn => btn.addEventListener('click', () => { clearTimers(); running = false; showWorkspace(); status.textContent = 'Workspace: the same note, opened in a larger writing surface.'; }));
  chromeTabs.forEach(tab => tab.addEventListener('click', () => { clearTimers(); running = false; tab.dataset.browserTab === 'workspace' ? showWorkspace() : showChat(); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimers(); else { resetVisuals(); running = true; runNotes(); } });

  resetVisuals();
  runNotes();
})();
