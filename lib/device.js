// Best-effort device detection from the User-Agent header, used only to
// tailor the "how do I get back" instructions on the practice-launch page.
// Not security-relevant — a wrong guess just shows slightly less specific steps.
function detectDevice(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

module.exports = { detectDevice };
