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
})();
