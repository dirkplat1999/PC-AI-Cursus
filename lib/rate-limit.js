// Lichtgewicht in-memory rate limiter per sleutel (bijvoorbeeld IP-adres +
// route) — geen extra dependency nodig voor een kleine, single-instance app
// als deze. Niet gedistribueerd: telt per servingsproces en reset bij een
// herstart, wat hier prima is (één container, geen load balancing).
const buckets = new Map();

function isRateLimited(key, { max, windowMs }) {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = [];
    buckets.set(key, bucket);
  }
  while (bucket.length && bucket[0] <= now - windowMs) bucket.shift();
  if (bucket.length >= max) return true;
  bucket.push(now);
  return false;
}

// Ruimt oude, inactieve sleutels op zodat de Map niet blijft groeien.
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [key, bucket] of buckets) {
    if (!bucket.length || bucket[bucket.length - 1] <= cutoff) buckets.delete(key);
  }
}, 15 * 60 * 1000).unref();

module.exports = { isRateLimited };
