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
  let sceneId = 0;
  let activeScene = null;

  const style = document.createElement('style');
  style.id = 'chatmargin-demo-v3-style';
  style.textContent = `
    .demo-shell::before{
      content:"Explore the demo · Click any of the four tabs: Notes, Prompts, Dashboard or Search";
      display:block;
      padding:10px 14px;
      background:linear-gradient(90deg,#f6f4ff,#fff,#f6f4ff);
      border-bottom:1px solid #dedbf6;
      color:#4b5570;
      font-size:11px;
      font-weight:850;
      text-align:center;
      letter-spacing:.01em
    }
    .demo-stage button,.demo-stage input{pointer-events:none!important;cursor:default!important}
    .demo-stage .cm-tab{pointer-events:auto!important;cursor:pointer!important;position:relative;z-index:3;transition:transform .2s ease,box-shadow .2s ease,background .2s ease,color .2s ease}
    .demo-stage .cm-tab:hover,.demo-stage .cm-tab.demo-hover{
      transform:translateY(-2px) scale(1.035);
      background:#fff!important;
      color:#30268e!important;
      box-shadow:0 0 0 2px rgba(111,92,255,.34),0 0 18px rgba(111,92,255,.42)!important
    }
    .demo-invite .cm-tab{animation:cmInvite 2.8s ease-in-out infinite}
    .demo-invite .cm-tab:nth-child(2){animation-delay:.32s}
    .demo-invite .cm-tab:nth-child(3){animation-delay:.64s}
    .demo-invite .cm-tab:nth-child(4){animation-delay:.96s}
    @keyframes cmInvite{
      0%,68%,100%{box-shadow:0 0 0 1px rgba(111,92,255,.10);background:transparent}
      82%{box-shadow:0 0 0 2px rgba(111,92,255,.34),0 0 20px rgba(111,92,255,.34);background:#fff;color:#30268e}
    }
    .cursor{
      display:block!important;
      opacity:1!important;
      width:34px;
      height:38px;
      z-index:80!important;
      transition:transform 1.25s cubic-bezier(.22,.8,.25,1),opacity .2s ease!important;
      filter:none!important
    }
    .cursor .arrow{
      display:block!important;
      font-size:31px!important;
      line-height:1!important;
      color:#fff!important;
      transform:none!important;
      -webkit-text-stroke:2px #111827;
      text-shadow:0 3px 5px rgba(0,0,0,.32)
    }
    .cursor .hand{display:none!important}
    .cursor::after{
      content:"";
      position:absolute;
      width:10px;
      height:10px;
      left:5px;
      top:5px;
      border:2px solid rgba(111,92,255,.95);
      border-radius:50%;
      opacity:0;
      transform:scale(.5)
    }
    .cursor.clicking::after{animation:cmClick .7s ease-out}
    @keyframes cmClick{0%{opacity:1;transform:scale(.5)}100%{opacity:0;transform:scale(3.6)}}
    .cursor.dragging .arrow{transform:scale(.9) rotate(-6deg)!important}
    .demo-running .cm-tab:not(.active){box-shadow:inset 0 0 0 1px rgba(111,92,255,.10)}
    .demo-status{font-weight:750;font-size:10px}
    .cm-tab.active{box-shadow:0 0 0 2px rgba(111,92,255,.30),0 5px 14px rgba(111,92,255,.16)!important}
    @media(max-width:620px){.demo-shell::before{font-size:10px;padding:9px 10px}.cursor{display:none!important}}
  `;
  document.head.appendChild(style);

  arrow.textContent = '↖';
  demo.querySelectorAll('button:not(.cm-tab)').forEach(button => { button.tabIndex = -1; });

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

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
    sceneId += 1;
  }

  function later(fn, ms, id = sceneId) {
    const timer = setTimeout(() => {
      if (id === sceneId) fn();
    }, ms);
    timers.push(timer);
    return timer;
  }

  function setProgress(index) {
    progress.forEach((item, i) => item.classList.toggle('active', i === index));
  }

  function setTab(name) {
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.demoTab === name));
    subTabs.hidden = name !== 'notes';
  }

  function setChat(key) {
    const chat = chats[key];
    chatTitle.textContent = chat.title;
    sideChatTitle.textContent = chat.title;
    contextTitle.textContent = chat.title;
    userMsg.textContent = chat.user;
    assistantMsg.textContent = chat.assistant;
    secondUser.textContent = chat.user2;
    secondAssistant.innerHTML = chat.assistant2;
  }

  function showChat() {
    workspaceScreen.hidden = true;
    chatScreen.hidden = false;
    chromeTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.browserTab === 'chatgpt'));
  }

  function showWorkspace() {
    chatScreen.hidden = true;
    workspaceScreen.hidden = false;
    chromeTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.browserTab === 'workspace'));
  }

  function pointFor(element, xRatio = .5, yRatio = .5) {
    if (!element || chatScreen.hidden) return null;
    const stage = chatScreen.getBoundingClientRect();
    const rect = element.getBoundingClientRect();
    const x = rect.left - stage.left + rect.width * xRatio - 8;
    const y = rect.top - stage.top + rect.height * yRatio - 8;
    return {
      x: Math.max(6, Math.min(stage.width - 38, x)),
      y: Math.max(6, Math.min(stage.height - 42, y))
    };
  }

  function moveCursorTo(element, options = {}) {
    const point = pointFor(element, options.x ?? .5, options.y ?? .5);
    if (!point) return;
    cursor.classList.toggle('dragging', Boolean(options.dragging));
    cursor.style.transform = `translate3d(${point.x}px, ${point.y}px, 0)`;
  }

  function clickCursor(element, options = {}) {
    moveCursorTo(element, options);
    later(() => {
      cursor.classList.remove('clicking');
      void cursor.offsetWidth;
      cursor.classList.add('clicking');
      later(() => cursor.classList.remove('clicking'), 720);
    }, 1250);
  }

  function notesHtml(step = 0) {
    return `<div class="note-page">
      <div class="note-toolbar ${step >= 1 ? 'visible' : ''}">
        <button data-tool="bold"><strong>B</strong></button><button data-tool="h1">H1</button><button data-tool="h2">H2</button><button data-tool="list">• List</button><button data-tool="todo">☑ To-do</button><button data-tool="link">↗ Link</button>
      </div>
      <div class="note-editor">
        <h3 class="note-heading ${step >= 2 ? 'formatted' : ''}">${step >= 2 ? 'Launch decisions' : 'Launch notes'}</h3>
        <p class="note-copy">Keep the launch simple and learn from real use.</p>
        <p class="imported ${step >= 1 ? 'show' : ''}"><strong>Start with Chrome and Chromium</strong>, focus on heavy ChatGPT users, and learn from the first active users before expanding.</p>
        <ul class="note-list ${step >= 3 ? 'show' : ''}"><li>Refresh onboarding</li><li>Publish local-first trust messaging</li><li>Interview active users</li></ul>
        <div class="checklist ${step >= 4 ? 'show' : ''}"><label><input type="checkbox" checked /> Website positioning refreshed</label><label><input type="checkbox" /> Interview active users</label></div>
      </div>
    </div>`;
  }

  function promptsHtml(order = ['Launch summary', 'Turn notes into actions', 'Find open questions'], draggingName = '') {
    const descriptions = {
      'Launch summary': 'Summarize this conversation into decisions and next steps.',
      'Turn notes into actions': 'Turn these notes into a short action list.',
      'Find open questions': 'List the unresolved questions in this chat.'
    };
    return `<div class="prompt-list">${order.map((name, index) => `<div class="prompt-card ${draggingName === name ? 'dragging-card' : ''}" data-prompt="${index}"><div class="drag-handle">⋮⋮</div><div><strong>${name}</strong><span>${descriptions[name]}</span></div><button class="send-prompt" data-send="${index}">Send to ChatGPT</button></div>`).join('')}</div>`;
  }

  function dashboardHtml() {
    return `<div class="dashboard-demo"><div class="dash-filters"><button class="active" data-filter="all">All</button><button data-filter="high">High priority</button><button data-filter="project">Product launch</button></div>
      <button class="dash-row" data-chat="research"><span class="dot high"></span><div><strong>User interview synthesis</strong><span>High priority · Follow-up</span></div></button>
      <button class="dash-row" data-chat="seo"><span class="dot medium"></span><div><strong>SEO content plan</strong><span>Medium priority · Follow-up</span></div></button>
      <button class="dash-row" data-chat="launch"><span class="dot low"></span><div><strong>Website launch plan</strong><span>Low priority · Open</span></div></button></div>`;
  }

  function searchHtml(query = '') {
    return `<div class="search-demo"><div class="search-box"><span>⌕</span><span class="query">${query || 'Search notes, prompts and conversations...'}</span></div>${query ? `<div class="search-results"><button data-result="conversation"><small>CONVERSATION</small><strong>SEO content plan</strong><span>Questions people ask about ChatGPT workflow...</span></button><button data-result="note"><small>NOTE</small><strong>Launch decisions</strong><span>Publish local-first trust messaging...</span></button><button data-result="prompt"><small>PROMPT</small><strong>Find open questions</strong><span>List the unresolved questions in this chat.</span></button></div>` : ''}</div>`;
  }

  function resetCommon(name) {
    showChat();
    setChat('launch');
    assistantMsg.classList.remove('selected-text');
    composerText.textContent = 'Ask anything';
    composerText.classList.remove('filled');
    tabs.forEach(tab => tab.classList.remove('demo-hover'));
    demo.classList.remove('demo-invite');
    demo.classList.add('demo-running');
    setTab(name);
    setProgress(['notes', 'prompts', 'dashboard', 'search'].indexOf(name));
  }

  function finishAndLoop(name, message, delay = 3800) {
    status.textContent = `${message} Click another tab anytime, or watch this one replay.`;
    demo.classList.remove('demo-running');
    tabs.filter(tab => tab.dataset.demoTab !== name).forEach(tab => tab.classList.add('demo-hover'));
    const id = sceneId;
    later(() => startScene(name), delay, id);
  }

  function runNotes(id) {
    resetCommon('notes');
    panelBody.innerHTML = notesHtml(0);
    status.textContent = 'Notes 1/6 · Select useful context from the ChatGPT conversation.';

    later(() => {
      moveCursorTo(assistantMsg, { x: .15, y: .55 });
    }, 900, id);

    later(() => {
      cursor.classList.add('dragging');
      moveCursorTo(assistantMsg, { x: .86, y: .55, dragging: true });
      assistantMsg.classList.add('selected-text');
    }, 2600, id);

    later(() => {
      status.textContent = 'Notes 2/6 · Bring the useful passage into the note beside the chat.';
      cursor.classList.remove('dragging');
      panelBody.innerHTML = notesHtml(1);
      assistantMsg.classList.remove('selected-text');
      moveCursorTo(panelBody.querySelector('.imported'), { x: .65, y: .5 });
    }, 4800, id);

    later(() => {
      status.textContent = 'Notes 3/6 · Format the note with headings and structure.';
      const h1 = panelBody.querySelector('[data-tool="h1"]');
      clickCursor(h1);
    }, 6800, id);

    later(() => {
      panelBody.innerHTML = notesHtml(2);
      const list = panelBody.querySelector('[data-tool="list"]');
      clickCursor(list);
    }, 8600, id);

    later(() => {
      panelBody.innerHTML = notesHtml(3);
      status.textContent = 'Notes 4/6 · Add a checklist for concrete next steps.';
      const todo = panelBody.querySelector('[data-tool="todo"]');
      clickCursor(todo);
    }, 10400, id);

    later(() => {
      panelBody.innerHTML = notesHtml(4);
      status.textContent = 'Notes 5/6 · Create sub-pages when the work becomes more complex.';
      const add = demo.querySelector('.add-subpage');
      clickCursor(add);
    }, 12300, id);

    later(() => {
      const button = demo.querySelector('.subpage-btn');
      button.textContent = 'Launch checklist';
      button.classList.add('active');
      demo.querySelector('.cm-subtabs > button:first-child').classList.remove('active');
      status.textContent = 'Notes 6/6 · Open the same note in the full Workspace when you need more room.';
      clickCursor(demo.querySelector('[data-open-workspace]'));
    }, 14400, id);

    later(() => {
      showWorkspace();
    }, 16300, id);

    later(() => {
      showChat();
      setTab('notes');
      setProgress(0);
      finishAndLoop('notes', 'Notes demo complete.');
    }, 19700, id);
  }

  function runPrompts(id) {
    resetCommon('prompts');
    panelBody.innerHTML = promptsHtml();
    status.textContent = 'Prompts 1/3 · Choose a saved prompt and send it to the ChatGPT composer.';

    later(() => {
      const send = panelBody.querySelector('[data-send="0"]');
      clickCursor(send);
    }, 1100, id);

    later(() => {
      composerText.textContent = 'Summarize this conversation into decisions and next steps.';
      composerText.classList.add('filled');
      status.textContent = 'Prompts 2/3 · The prompt is inserted into ChatGPT without retyping it.';
      moveCursorTo(composerText, { x: .55, y: .5 });
    }, 3300, id);

    later(() => {
      status.textContent = 'Prompts 3/3 · Drag prompts to keep the most useful ones where you want them.';
      const secondHandle = panelBody.querySelectorAll('.drag-handle')[1];
      moveCursorTo(secondHandle, { dragging: true });
      panelBody.innerHTML = promptsHtml(['Launch summary', 'Turn notes into actions', 'Find open questions'], 'Turn notes into actions');
    }, 5600, id);

    later(() => {
      const firstCard = panelBody.querySelector('.prompt-card');
      moveCursorTo(firstCard, { x: .2, y: .5, dragging: true });
    }, 7300, id);

    later(() => {
      cursor.classList.remove('dragging');
      panelBody.innerHTML = promptsHtml(['Turn notes into actions', 'Launch summary', 'Find open questions']);
      finishAndLoop('prompts', 'Prompts demo complete.');
    }, 9200, id);
  }

  function runDashboard(id) {
    resetCommon('dashboard');
    panelBody.innerHTML = dashboardHtml();
    status.textContent = 'Dashboard 1/3 · Filter unfinished work by priority.';

    later(() => {
      const high = panelBody.querySelector('[data-filter="high"]');
      clickCursor(high);
    }, 1200, id);

    later(() => {
      const filters = panelBody.querySelectorAll('.dash-filters button');
      filters.forEach(button => button.classList.remove('active'));
      panelBody.querySelector('[data-filter="high"]').classList.add('active');
      status.textContent = 'Dashboard 2/3 · Open a follow-up and the ChatGPT conversation changes with it.';
      clickCursor(panelBody.querySelector('[data-chat="research"]'));
    }, 3600, id);

    later(() => {
      setChat('research');
    }, 5400, id);

    later(() => {
      status.textContent = 'Dashboard 3/3 · Jump to another unfinished conversation without losing the thread.';
      clickCursor(panelBody.querySelector('[data-chat="seo"]'));
    }, 7000, id);

    later(() => {
      setChat('seo');
      finishAndLoop('dashboard', 'Dashboard demo complete.');
    }, 9000, id);
  }

  function runSearch(id) {
    resetCommon('search');
    panelBody.innerHTML = searchHtml('');
    status.textContent = 'Search 1/3 · Search across known conversations, notes and prompts.';

    later(() => {
      moveCursorTo(panelBody.querySelector('.search-box'), { x: .42, y: .5 });
    }, 1100, id);

    later(() => {
      panelBody.innerHTML = searchHtml('local');
    }, 2700, id);
    later(() => {
      panelBody.innerHTML = searchHtml('local-first');
      status.textContent = 'Search 2/3 · Results show where the match comes from: conversation, note or prompt.';
    }, 4100, id);

    later(() => {
      const result = panelBody.querySelector('[data-result="conversation"]');
      clickCursor(result);
      result.classList.add('selected-result');
      status.textContent = 'Search 3/3 · Open the result and jump back into the relevant ChatGPT conversation.';
    }, 5900, id);

    later(() => {
      setChat('seo');
      finishAndLoop('search', 'Search demo complete.');
    }, 8200, id);
  }

  function startScene(name) {
    clearTimers();
    activeScene = name;
    const id = sceneId;
    if (name === 'notes') runNotes(id);
    if (name === 'prompts') runPrompts(id);
    if (name === 'dashboard') runDashboard(id);
    if (name === 'search') runSearch(id);
  }

  function startInvite(index = 0) {
    clearTimers();
    activeScene = null;
    showChat();
    setChat('launch');
    panelBody.innerHTML = notesHtml(0);
    setTab('notes');
    setProgress(-1);
    composerText.textContent = 'Ask anything';
    composerText.classList.remove('filled');
    demo.classList.remove('demo-running');
    demo.classList.add('demo-invite');
    status.textContent = 'Click Notes, Prompts, Dashboard or Search to see a slow guided demo.';

    const guide = step => {
      if (activeScene) return;
      tabs.forEach(tab => tab.classList.remove('demo-hover'));
      const tab = tabs[step % tabs.length];
      tab.classList.add('demo-hover');
      moveCursorTo(tab);
      later(() => guide(step + 1), 2500);
    };
    later(() => guide(index), 500);
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', event => {
      event.preventDefault();
      startScene(tab.dataset.demoTab);
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearTimers();
    } else if (activeScene) {
      startScene(activeScene);
    } else {
      startInvite();
    }
  });

  startInvite();
})();
