const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: admin access required' });
};

module.exports = { admin };
