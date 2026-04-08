const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');

// 加载环境变量
if (fs.existsSync('.env')) {
  require('dotenv').config();
}

const config = require('./config');
const store = require('./store');

const app = express();
const uploadDir = config.uploadDir;
const loginAttempts = new Map();
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']);
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

if (config.trustProxy) {
  app.set('trust proxy', 1);
}

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'"
  );
  next();
});

// 配置 session
app.use(session({
  name: config.sessionName,
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  unset: 'destroy',
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.sessionCookieSecure,
    priority: 'high',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function createSafeStoredFilename(originalName) {
  const normalized = path.basename(originalName).normalize('NFC');
  const safeName = normalized.replace(/[^\p{L}\p{N}._ -]/gu, '_').slice(0, 180) || 'file';
  return `${Date.now()}-${crypto.randomUUID()}-${safeName}`;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    cb(null, createSafeStoredFilename(originalName));
  }
});

const upload = multer({
  storage,
  limits: {
    files: 1,
    fileSize: config.maxFileSizeBytes
  }
});

app.use(express.json({ limit: config.bodyLimit }));
app.use(express.urlencoded({ extended: false, limit: config.bodyLimit }));

function checkAuth(req, res, next) {
  if (req.session && req.session.isAuthenticated) {
    res.setHeader('Cache-Control', 'no-store');
    next();
  } else {
    res.status(401).json({ error: '请先登录' });
  }
}

function getClientKey(req) {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function cleanupExpiredLoginAttempts(now) {
  for (const [key, entry] of loginAttempts.entries()) {
    if (now - entry.firstAttemptAt > config.loginWindowMs) {
      loginAttempts.delete(key);
    }
  }
}

function isRateLimited(req) {
  const now = Date.now();
  cleanupExpiredLoginAttempts(now);

  const entry = loginAttempts.get(getClientKey(req));
  if (!entry) {
    return false;
  }

  return entry.count >= config.loginMaxAttempts && now - entry.firstAttemptAt <= config.loginWindowMs;
}

function recordLoginFailure(req) {
  const now = Date.now();
  const key = getClientKey(req);
  const existing = loginAttempts.get(key);

  if (!existing || now - existing.firstAttemptAt > config.loginWindowMs) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now });
    return;
  }

  existing.count += 1;
}

function clearLoginFailures(req) {
  loginAttempts.delete(getClientKey(req));
}

function safeCompare(secret, input) {
  const left = Buffer.from(String(secret));
  const right = Buffer.from(String(input));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function getExpectedOrigin(req) {
  if (config.appOrigin) {
    return config.appOrigin;
  }

  const forwardedProto = req.get('x-forwarded-proto');
  const forwardedHost = req.get('x-forwarded-host');
  if (forwardedProto && (forwardedHost || req.get('host'))) {
    return `${forwardedProto.split(',')[0].trim()}://${(forwardedHost || req.get('host')).split(',')[0].trim()}`;
  }

  const host = req.get('host');
  if (!host) {
    return '';
  }

  return `${req.protocol}://${host}`;
}

function isTrustedOrigin(req) {
  const origin = req.get('origin');
  if (!origin) {
    return true;
  }

  try {
    const actualOrigin = new URL(origin).origin;
    const allowedOrigins = [getExpectedOrigin(req)];

    const host = req.get('host');
    if (host) {
      allowedOrigins.push(`http://${host}`, `https://${host}`);
    }

    const forwardedHost = req.get('x-forwarded-host');
    if (forwardedHost) {
      const normalizedForwardedHost = forwardedHost.split(',')[0].trim();
      allowedOrigins.push(`http://${normalizedForwardedHost}`, `https://${normalizedForwardedHost}`);
    }

    return allowedOrigins
      .filter(Boolean)
      .some((allowedOrigin) => {
        try {
          return new URL(allowedOrigin).origin === actualOrigin;
        } catch (error) {
          return false;
        }
      });
  } catch (error) {
    return false;
  }
}

function resolveUploadPath(storedFilename) {
  const candidate = path.resolve(uploadDir, storedFilename);
  if (!candidate.startsWith(uploadDir + path.sep)) {
    return null;
  }
  return candidate;
}

function isImageFile(filename) {
  return imageExtensions.has(path.extname(filename).toLowerCase());
}

function getFileItemOr404(req, res) {
  const storedFilename = path.basename(req.params.filename || '');
  const item = store.getByStoredFilename(storedFilename);

  if (!item) {
    res.status(404).json({ error: '文件不存在' });
    return null;
  }

  const filePath = resolveUploadPath(item.filepath);
  if (!filePath || !fs.existsSync(filePath)) {
    res.status(404).json({ error: '文件不存在' });
    return null;
  }

  return { item, filePath };
}

app.use((req, res, next) => {
  if (!unsafeMethods.has(req.method)) {
    return next();
  }

  if (isTrustedOrigin(req)) {
    return next();
  }

  res.status(403).json({ error: '不允许的请求来源' });
});

app.post('/login', (req, res) => {
  const pin = typeof req.body.pin === 'string' ? req.body.pin.trim() : '';

  if (isRateLimited(req)) {
    return res.status(429).json({ success: false, message: '尝试次数过多，请稍后再试' });
  }

  if (pin && safeCompare(config.pin, pin)) {
    clearLoginFailures(req);
    req.session.regenerate((err) => {
      if (err) {
        console.error('登录时重建 session 失败:', err);
        return res.status(500).json({ success: false, message: '登录失败，请重试' });
      }

      req.session.isAuthenticated = true;
      res.json({ success: true, message: '登录成功' });
    });
  } else {
    recordLoginFailure(req);
    res.status(401).json({ success: false, message: 'Pin码错误' });
  }
});

app.post('/logout', checkAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('登出失败:', err);
      return res.status(500).json({ success: false, message: '登出失败，请重试' });
    }

    res.clearCookie(config.sessionName);
    res.json({ success: true, message: '登出成功' });
  });
});

app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.session && req.session.isAuthenticated) {
    return res.redirect('/index.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets')));

app.get('/index.html', checkAuth, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/items', checkAuth, (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(store.getAll());
});

app.post('/api/items/text', checkAuth, (req, res) => {
  const text = typeof req.body.text === 'string' ? req.body.text : '';
  const normalizedText = text.replace(/\r\n/g, '\n');

  if (!normalizedText.trim()) {
    return res.status(400).json({ error: '文本内容不能为空' });
  }

  if (normalizedText.length > 10_000) {
    return res.status(400).json({ error: '文本内容过长' });
  }

  const newItem = {
    id: crypto.randomUUID(),
    type: 'text',
    content: normalizedText,
    timestamp: new Date().toISOString()
  };

  store.add(newItem);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(newItem);
});

app.post('/api/items/file', checkAuth, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: `文件不能超过 ${Math.floor(config.maxFileSizeBytes / 1024 / 1024)} MB` });
      }
      return res.status(400).json({ error: '上传失败，请检查文件后重试' });
    }
    if (err) {
      return next(err);
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请选择文件' });
  }

  const originalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8').trim() || 'file';
  const newItem = {
    id: crypto.randomUUID(),
    type: 'file',
    filename: path.basename(originalName).slice(0, 255),
    filepath: req.file.filename,
    size: req.file.size,
    timestamp: new Date().toISOString()
  };

  store.add(newItem);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.json(newItem);
});

app.delete('/api/items/:id', checkAuth, (req, res) => {
  const id = req.params.id;
  const item = store.getById(id);
  if (!item) {
    return res.status(404).json({ error: '项目不存在' });
  }

  if (item.type === 'file') {
    const filePath = resolveUploadPath(item.filepath);
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  store.remove(id);
  res.json({ success: true, message: '删除成功' });
});

app.get('/download/:filename', checkAuth, (req, res) => {
  const fileData = getFileItemOr404(req, res);
  if (!fileData) {
    return;
  }

  const { item, filePath } = fileData;
  res.setHeader('Cache-Control', 'private, no-store');
  res.download(filePath, item.filename);
});

// 图片预览端点 - 用于前端 img 标签加载
app.get('/preview/:filename', checkAuth, (req, res) => {
  const fileData = getFileItemOr404(req, res);
  if (!fileData) {
    return;
  }

  const { item, filePath } = fileData;
  if (!isImageFile(item.filename)) {
    return res.status(400).json({ error: '该文件不支持预览' });
  }

  res.setHeader('Cache-Control', 'private, no-store');
  res.type(path.extname(item.filename));
  res.sendFile(filePath);
});

app.use((err, req, res, next) => {
  console.error('未处理的请求错误:', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(500).json({ error: '服务器内部错误' });
});

app.listen(config.port, () => {
  console.log(`服务器运行在 http://localhost:${config.port}`);
});
