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

  // --- Service worker for basic offline access ---
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
})();
