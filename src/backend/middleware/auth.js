const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Không có token xác thực.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
    req.user = user;
    next();
  });
};

const adminOnly = (req, res, next) => {
  if (req.user.vai_tro !== 'admin') {
    return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền truy cập.' });
  }
  next();
};

const recruiterOrAdmin = (req, res, next) => {
  if (!['nha_tuyen_dung', 'admin'].includes(req.user.vai_tro)) {
    return res.status(403).json({ success: false, message: 'Yêu cầu quyền nhà tuyển dụng hoặc admin.' });
  }
  next();
};

module.exports = { authMiddleware, adminOnly, recruiterOrAdmin };
