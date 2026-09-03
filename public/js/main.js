(function () {
  const FONT_STEPS = ['font-small', 'font-normal', 'font-large', 'font-xlarge'];

  function applyPrefs() {
    const fontClass = localStorage.getItem('pcai-font') || 'font-normal';
    const contrast = localStorage.getItem('pcai-contrast') === '1';
    FONT_STEPS.forEach((c) => document.body.classList.remove(c));
    document.body.classList.add(fontClass);
    document.body.classList.toggle('high-contrast', contrast);
  }
  applyPrefs();

  function savePreferences(partial) {
    if (window.APP_ROLE !== 'student') return;
    fetch('/student/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partial)
    }).catch(() => {});
  }

  const decBtn = document.getElementById('btn-font-decrease');
  const incBtn = document.getElementById('btn-font-increase');
  const contrastBtn = document.getElementById('btn-contrast');

  function currentFontIndex() {
    const cls = localStorage.getItem('pcai-font') || 'font-normal';
    return Math.max(0, FONT_STEPS.indexOf(cls));
  }

  decBtn?.addEventListener('click', () => {
    const idx = Math.max(0, currentFontIndex() - 1);
    localStorage.setItem('pcai-font', FONT_STEPS[idx]);
    applyPrefs();
    savePreferences({ font_size: FONT_STEPS[idx] });
  });
  incBtn?.addEventListener('click', () => {
    const idx = Math.min(FONT_STEPS.length - 1, currentFontIndex() + 1);
    localStorage.setItem('pcai-font', FONT_STEPS[idx]);
    applyPrefs();
    savePreferences({ font_size: FONT_STEPS[idx] });
  });
  contrastBtn?.addEventListener('click', () => {
    const on = !(localStorage.getItem('pcai-contrast') === '1');
    localStorage.setItem('pcai-contrast', on ? '1' : '0');
    applyPrefs();
    savePreferences({ high_contrast: on });
  });

  // --- Text to speech ---
  const readBtn = document.getElementById('btn-read-aloud');
  const readLabel = document.getElementById('read-aloud-label');
  const readIconIdle = document.getElementById('read-aloud-icon-idle');
  const readIconActive = document.getElementById('read-aloud-icon-active');
  const langMap = { nl: 'nl-NL', en: 'en-US', de: 'de-DE' };

  function setReadAloudState(active) {
    if (readLabel) readLabel.textContent = active
      ? (readBtn.dataset.labelActive || 'Stop')
      : (readBtn.dataset.labelIdle || 'Voorlezen');
    readIconIdle?.classList.toggle('hidden', active);
    readIconActive?.classList.toggle('hidden', !active);
  }

  readBtn?.addEventListener('click', () => {
    if (!('speechSynthesis' in window)) {
      alert('Voorlezen wordt niet ondersteund in deze browser.');
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setReadAloudState(false);
      return;
    }
    const stepBody = document.getElementById('step-body');
    const text = stepBody ? stepBody.innerText : document.body.innerText;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langMap[readBtn.dataset.lang] || langMap[window.APP_LANG] || 'nl-NL';
    utter.onend = () => setReadAloudState(false);
    setReadAloudState(true);
    window.speechSynthesis.speak(utter);
  });

  // --- Help button (student) ---
  const helpFab = document.getElementById('help-fab');
  const helpModal = document.getElementById('help-modal');
  const helpCancel = document.getElementById('help-cancel');
  const helpSend = document.getElementById('help-send');
  const helpMessage = document.getElementById('help-message');
  const helpStatus = document.getElementById('help-status');

  helpFab?.addEventListener('click', () => helpModal.classList.remove('hidden'));
  helpCancel?.addEventListener('click', () => helpModal.classList.add('hidden'));

  helpSend?.addEventListener('click', () => {
    const moduleMatch = window.location.pathname.match(/\/student\/module\/([^/]+)/);
    fetch('/student/help', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: helpMessage.value,
        module_key: moduleMatch ? moduleMatch[1] : null
      })
    }).then(() => {
      helpStatus.textContent = window.APP_I18N.helpSent || 'Verstuurd!';
      helpMessage.value = '';
      setTimeout(() => {
        helpModal.classList.add('hidden');
        helpStatus.textContent = '';
      }, 1500);
    }).catch(() => {
      helpStatus.textContent = 'Er ging iets mis. Probeer het opnieuw.';
    });
  });

  // --- Aanbevolen modules per leeftijdsgroep (beheerder: cursistenformulier) ---
  document.querySelectorAll('[data-recommend-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const ageSelect = document.getElementById(btn.dataset.ageSelect);
      const scope = document.getElementById(btn.dataset.checkboxScope);
      if (!ageSelect || !scope || !window.RECOMMENDED_MODULES) return;
      const recommended = window.RECOMMENDED_MODULES[ageSelect.value] || [];
      scope.querySelectorAll('input[type="checkbox"][name="modules"]').forEach((cb) => {
        cb.checked = recommended.includes(cb.value);
      });
    });
  });

  // --- Phishing-mail oefening (nep-postvak-widget) ---
  function resetPhishSim(sim) {
    sim.querySelector('[data-phish-reveal-bad]')?.classList.add('hidden');
    sim.querySelector('[data-phish-reveal-good]')?.classList.add('hidden');
    sim.querySelector('[data-phish-menu]')?.classList.add('hidden');
    sim.querySelector('[data-phish-more]')?.setAttribute('aria-expanded', 'false');
    sim.querySelector('[data-phish-email]')?.classList.add('hidden');
    const openBtn = sim.querySelector('[data-phish-open]');
    openBtn?.classList.remove('hidden');
    openBtn?.setAttribute('aria-expanded', 'false');
    return openBtn;
  }

  document.querySelectorAll('[data-phish-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sim = btn.closest('.phish-sim');
      btn.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'true');
      sim.querySelector('[data-phish-email]')?.classList.remove('hidden');
    });
  });

  document.querySelectorAll('[data-phish-more]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sim = btn.closest('.phish-sim');
      const menu = sim.querySelector('[data-phish-menu]');
      const nowOpen = menu?.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
    });
  });

  // Clicking the CTA link is the "wrong" action: shows the warning reveal
  // and alerts the teacher's dashboard, so they know who needs follow-up.
  document.querySelectorAll('[data-phish-click]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sim = btn.closest('.phish-sim');
      sim.querySelector('[data-phish-email]')?.classList.add('hidden');
      const reveal = sim.querySelector('[data-phish-reveal-bad]');
      reveal?.classList.remove('hidden');
      reveal?.focus();

      if (window.APP_ROLE === 'student') {
        const moduleMatch = window.location.pathname.match(/\/student\/module\/([^/]+)/);
        fetch('/student/phishing-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ module_key: moduleMatch ? moduleMatch[1] : null })
        }).catch(() => {});
      }
    });
  });

  // Deleting the message (via the ⋮ menu) is the correct action.
  document.querySelectorAll('[data-phish-delete]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sim = btn.closest('.phish-sim');
      sim.querySelector('[data-phish-menu]')?.classList.add('hidden');
      sim.querySelector('[data-phish-email]')?.classList.add('hidden');
      const reveal = sim.querySelector('[data-phish-reveal-good]');
      reveal?.classList.remove('hidden');
      reveal?.focus();
    });
  });

  document.querySelectorAll('[data-phish-reset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sim = btn.closest('.phish-sim');
      resetPhishSim(sim)?.focus();
    });
  });

  // --- Woordenlijst-tooltips: moeilijke woorden in lesteksten en de
  // woordenlijst zelf krijgen automatisch een hover/tap-uitleg. ---
  (function initGlossaryTooltips() {
    const glossary = Array.isArray(window.APP_GLOSSARY) ? window.APP_GLOSSARY : [];
    if (!glossary.length) return;

    function escapeRegExp(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Build a phrase -> definition lookup. A term like "2FA (tweestapsverificatie)"
    // becomes two matchable phrases ("2FA" and "tweestapsverificatie") that both
    // resolve to the same definition, so either wording in lesson text is caught.
    const phraseToDefinition = new Map();
    glossary.forEach((entry) => {
      if (!entry || !entry.term || !entry.definition) return;
      const parenMatch = entry.term.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
      const phrases = parenMatch ? [parenMatch[1].trim(), parenMatch[2].trim()] : [entry.term.trim()];
      phrases.forEach((phrase) => {
        if (phrase.length < 2) return;
        const key = phrase.toLowerCase();
        if (!phraseToDefinition.has(key)) {
          phraseToDefinition.set(key, { phrase, definition: entry.definition });
        }
      });
    });
    if (!phraseToDefinition.size) return;

    // Longest phrase first, so e.g. "Wachtwoordmanager" matches before "Wachtwoord".
    const phrases = Array.from(phraseToDefinition.values()).sort((a, b) => b.phrase.length - a.phrase.length);
    const pattern = new RegExp(
      '(?<![\\p{L}\\p{N}])(' + phrases.map((p) => escapeRegExp(p.phrase)).join('|') + ')(?![\\p{L}\\p{N}])',
      'giu'
    );

    // --- Shared tooltip element ---
    let tooltipEl = null;
    let openTrigger = null;

    function getTooltip() {
      if (tooltipEl) return tooltipEl;
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'glossary-tooltip';
      tooltipEl.className = 'glossary-tooltip hidden';
      tooltipEl.setAttribute('role', 'tooltip');
      document.body.appendChild(tooltipEl);
      return tooltipEl;
    }

    function positionTooltip(target) {
      const tip = getTooltip();
      const targetRect = target.getBoundingClientRect();
      const tipRect = tip.getBoundingClientRect();
      const margin = 8;

      let left = targetRect.left + targetRect.width / 2 - tipRect.width / 2;
      left = Math.max(margin, Math.min(left, window.innerWidth - tipRect.width - margin));

      let top = targetRect.top - tipRect.height - margin;
      let placement = 'top';
      if (top < margin) {
        top = targetRect.bottom + margin;
        placement = 'bottom';
      }

      tip.style.left = `${Math.round(left)}px`;
      tip.style.top = `${Math.round(top)}px`;
      tip.classList.toggle('glossary-tooltip-below', placement === 'bottom');
    }

    function showTooltip(target) {
      const tip = getTooltip();
      tip.textContent = target.dataset.definition || '';
      tip.classList.remove('hidden');
      positionTooltip(target);
      openTrigger = target;
      target.setAttribute('aria-expanded', 'true');
    }

    function hideTooltip() {
      if (!tooltipEl) return;
      tooltipEl.classList.add('hidden');
      if (openTrigger) openTrigger.setAttribute('aria-expanded', 'false');
      openTrigger = null;
    }

    // --- Wrap matching phrases inside a container's text nodes ---
    function wrapContainer(root) {
      if (!root || root.dataset.glossaryScanned === '1') return;
      root.dataset.glossaryScanned = '1';

      const seen = new Set();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parentTag = node.parentElement ? node.parentElement.tagName : '';
          if (parentTag === 'SCRIPT' || parentTag === 'STYLE') return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest('.glossary-term')) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });

      const textNodes = [];
      let n;
      while ((n = walker.nextNode())) textNodes.push(n);

      textNodes.forEach((node) => {
        const text = node.nodeValue;
        pattern.lastIndex = 0;
        if (!pattern.test(text)) return;
        pattern.lastIndex = 0;

        const frag = document.createDocumentFragment();
        let lastIndex = 0;
        let match;
        let changed = false;
        while ((match = pattern.exec(text))) {
          const key = match[1].toLowerCase();
          const entry = phraseToDefinition.get(key);
          if (!entry || seen.has(key)) continue;

          frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          const span = document.createElement('span');
          span.className = 'glossary-term';
          span.tabIndex = 0;
          span.setAttribute('role', 'button');
          span.setAttribute('aria-expanded', 'false');
          span.dataset.definition = entry.definition;
          span.textContent = match[1];
          frag.appendChild(span);

          seen.add(key);
          lastIndex = match.index + match[1].length;
          changed = true;
        }
        if (!changed) return;
        frag.appendChild(document.createTextNode(text.slice(lastIndex)));
        node.parentNode.replaceChild(frag, node);
      });
    }

    function scanAll() {
      document.querySelectorAll('#step-body').forEach(wrapContainer);
      document.querySelectorAll('.glossary-item strong, .glossary-item p').forEach(wrapContainer);
    }
    scanAll();

    // --- Interaction: hover (mouse), focus/blur (keyboard), tap (touch) ---
    document.addEventListener('mouseover', (e) => {
      const term = e.target.closest && e.target.closest('.glossary-term');
      if (term) showTooltip(term);
    });
    document.addEventListener('mouseout', (e) => {
      const term = e.target.closest && e.target.closest('.glossary-term');
      if (term && term === openTrigger) hideTooltip();
    });
    document.addEventListener('focusin', (e) => {
      const term = e.target.closest && e.target.closest('.glossary-term');
      if (term) showTooltip(term);
    });
    document.addEventListener('focusout', (e) => {
      const term = e.target.closest && e.target.closest('.glossary-term');
      if (term && term === openTrigger) hideTooltip();
    });
    // Tap support for touch devices, which have no hover state. (Not a
    // toggle: mouseover already opens it for pointer devices, so treating
    // click as "open" too — rather than "open unless already open" — avoids
    // a click right after a hover immediately closing the tooltip again.)
    document.addEventListener('click', (e) => {
      const term = e.target.closest && e.target.closest('.glossary-term');
      if (term) { showTooltip(term); return; }
      hideTooltip();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && openTrigger) {
        const el = openTrigger;
        hideTooltip();
        el.focus();
      }
    });
    window.addEventListener('scroll', () => { if (openTrigger) positionTooltip(openTrigger); }, true);
    window.addEventListener('resize', () => { if (openTrigger) positionTooltip(openTrigger); });
  })();

  // --- Service worker for basic offline access ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
})();
