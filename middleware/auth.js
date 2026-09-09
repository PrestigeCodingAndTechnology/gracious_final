export function requireAdmin(req, res, next) {
  if (req.session?.user?.role === 'admin') return next();
  req.session.returnTo = req.originalUrl;
  return res.redirect('/admin/login');
}

export function exposeUser(req, res, next) {
  res.locals.currentUser = req.session?.user || null;
  res.locals.currentPath = req.path;
  res.locals.success = req.session?.success || null;
  res.locals.error = req.session?.error || null;
  delete req.session?.success;
  delete req.session?.error;
  next();
}
