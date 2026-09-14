(function () {
  if (typeof io === 'undefined') return;
  const socket = io();
  socket.emit('join-admin');

  const helpList = document.getElementById('help-list');
  const helpEmpty = document.getElementById('help-empty');
  const liveDot = document.getElementById('help-live-dot');
  const sound = document.getElementById('help-sound');

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function addHelpItem(data) {
    if (helpEmpty) helpEmpty.remove();
    const li = document.createElement('li');
    li.className = 'help-item';
    li.dataset.id = data.id;
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(data.studentName)}</strong> (${escapeHtml(data.username)})
        ${data.moduleKey ? `<span class="tag">${escapeHtml(data.moduleKey)}</span>` : ''}
        <p>${escapeHtml(data.message) || '(geen bericht)'}</p>
        <small>${new Date(data.createdAt).toLocaleTimeString()}</small>
      </div>
      <form method="POST" action="/admin/help/${data.id}/resolve">
        <button type="submit" class="btn btn-small">Afgehandeld</button>
      </form>
    `;
    helpList.prepend(li);
  }

  socket.on('help-request', (data) => {
    addHelpItem(data);
    liveDot?.classList.remove('hidden');
    sound?.play().catch(() => {});
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Nieuwe hulpvraag', { body: `${data.studentName}: ${data.message || 'vraagt om hulp'}` });
    }
    setTimeout(() => liveDot?.classList.add('hidden'), 4000);
  });

  socket.on('help-resolved', (data) => {
    const item = helpList?.querySelector(`li[data-id="${data.id}"]`);
    item?.remove();
    if (helpList && !helpList.querySelector('li')) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.id = 'help-empty';
      li.textContent = 'Geen openstaande hulpvragen.';
      helpList.appendChild(li);
    }
  });

  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // --- Toegangsaanvragen (live, zonder de pagina te herladen) ---
  const accessList = document.getElementById('access-list');
  const accessEmpty = document.getElementById('access-empty');
  const accessLiveDot = document.getElementById('access-live-dot');

  function addAccessItem(data) {
    if (!accessList) return;
    document.getElementById('access-empty')?.remove();
    const li = document.createElement('li');
    li.className = 'help-item';
    li.dataset.id = data.id;
    li.innerHTML = `
      <div>
        <strong>${escapeHtml(data.fullName)}</strong> (${escapeHtml(data.email)})
        <p>${escapeHtml(data.message) || '(geen bericht)'}</p>
        <small>${new Date(data.createdAt).toLocaleTimeString()}</small>
      </div>
      <div class="student-row-actions">
        <form method="POST" action="/admin/access-requests/${data.id}/approve">
          <button type="submit" class="btn btn-small btn-primary">Goedkeuren</button>
        </form>
        <form method="POST" action="/admin/access-requests/${data.id}/reject" onsubmit="return confirm('Aanvraag van ${escapeHtml(data.fullName)} afwijzen?');">
          <button type="submit" class="btn btn-small btn-danger">Afwijzen</button>
        </form>
      </div>
    `;
    accessList.prepend(li);
  }

  socket.on('access-request', (data) => {
    addAccessItem(data);
    accessLiveDot?.classList.remove('hidden');
    sound?.play().catch(() => {});
    if (window.Notification && Notification.permission === 'granted') {
      new Notification('Nieuwe toegangsaanvraag', { body: data.fullName });
    }
    setTimeout(() => accessLiveDot?.classList.add('hidden'), 4000);
  });

  socket.on('access-request-resolved', (data) => {
    const item = accessList?.querySelector(`li[data-id="${data.id}"]`);
    item?.remove();
    if (accessList && !accessList.querySelector('li')) {
      const li = document.createElement('li');
      li.className = 'empty';
      li.id = 'access-empty';
      li.textContent = 'Geen openstaande toegangsaanvragen.';
      accessList.appendChild(li);
    }
  });
})();
