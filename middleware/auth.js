function requireAdmin(req, res, next) {
  if (req.session && req.session.role === 'admin') return next();
  return res.redirect('/login');
}

function requireStudent(req, res, next) {
  if (req.session && req.session.role === 'student') return next();
  return res.redirect('/login');
}

function requireAnyAuth(req, res, next) {
  if (req.session && (req.session.role === 'admin' || req.session.role === 'student')) return next();
  return res.redirect('/login');
}

module.exports = { requireAdmin, requireStudent, requireAnyAuth };
