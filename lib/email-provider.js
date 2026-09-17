// Herkent de e-mailprovider van een cursist aan het domein van hun
// e-mailadres, zodat lesstappen over e-mailen provider-specifieke tips en
// een kloppende oefenlink kunnen tonen in plaats van standaard Gmail.
const DOMAIN_MAP = {
  'gmail.com': 'gmail',
  'googlemail.com': 'gmail',
  'outlook.com': 'outlook',
  'hotmail.com': 'outlook',
  'hotmail.nl': 'outlook',
  'live.com': 'outlook',
  'live.nl': 'outlook',
  'msn.com': 'outlook',
  'kpnmail.nl': 'kpn',
  'planet.nl': 'kpn',
  'icloud.com': 'icloud',
  'me.com': 'icloud',
  'mac.com': 'icloud',
  'yahoo.com': 'yahoo',
  'yahoo.nl': 'yahoo',
  'ymail.com': 'yahoo'
};

const PROVIDER_NAMES = {
  gmail: 'Gmail',
  outlook: 'Outlook',
  kpn: 'KPN Mail',
  icloud: 'iCloud Mail',
  yahoo: 'Yahoo Mail'
};

const PROVIDER_WEBMAIL_URL = {
  gmail: 'https://mail.google.com',
  outlook: 'https://outlook.live.com/mail/',
  kpn: 'https://mail.kpnmail.nl',
  icloud: 'https://www.icloud.com/mail',
  yahoo: 'https://mail.yahoo.com'
};

// Deliberately loose (not full RFC 5322) — this only needs to reject
// obviously-malformed input and, importantly, any CR/LF or other control
// characters, which would otherwise let a crafted "email" field inject
// extra headers into outgoing mail (classic email-header injection).
const EMAIL_RE = /^[^\s@<>()[\]:;,"]+@[^\s@<>()[\]:;,"]+\.[^\s@<>()[\]:;,"]+$/;
function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 200 && !/[\r\n\0]/.test(email) && EMAIL_RE.test(email.trim());
}

function detectProvider(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return null;
  const domain = email.trim().toLowerCase().split('@').pop();
  return DOMAIN_MAP[domain] || null;
}

function providerName(key) {
  return PROVIDER_NAMES[key] || null;
}

function providerWebmailUrl(key) {
  return PROVIDER_WEBMAIL_URL[key] || null;
}

module.exports = { detectProvider, providerName, providerWebmailUrl, PROVIDER_NAMES, isValidEmail };
