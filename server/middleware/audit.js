const { AuditLog } = require('../models/Misc');

const auditLog = (action, module) => async (req, res, next) => {
  const originalJson = res.json.bind(res);
  res.json = async function (data) {
    if (res.statusCode < 400 && req.user) {
      try {
        await AuditLog.create({
          actor: req.user._id,
          actorEmail: req.user.email,
          actorRole: req.user.role,
          action,
          module,
          resourceId: req.params?.id || data?.data?._id?.toString(),
          resourceModel: module,
          details: { method: req.method, path: req.path, body: sanitizeBody(req.body) },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          status: 'success'
        });
      } catch (err) {
        console.error('Audit log error:', err.message);
      }
    }
    return originalJson(data);
  };
  next();
};

function sanitizeBody(body) {
  if (!body) return {};
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.confirmPassword;
  delete sanitized.token;
  return sanitized;
}

module.exports = { auditLog };
