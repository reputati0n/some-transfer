const path = require('path');
const crypto = require('crypto');

function readString(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function readPositiveInt(name, fallback) {
  const value = Number.parseInt(process.env[name], 10);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

const env = readString('NODE_ENV') || 'development';
const isProduction = env === 'production';

const pin = readString('APP_PIN');
if (!pin) {
  throw new Error('Missing required environment variable: APP_PIN');
}

let sessionSecret = readString('SESSION_SECRET');
if (!sessionSecret) {
  if (isProduction) {
    throw new Error('Missing required environment variable: SESSION_SECRET');
  }
  sessionSecret = crypto.randomBytes(32).toString('hex');
  console.warn('SESSION_SECRET not set, generated a temporary secret for this process.');
}

if (sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters long.');
}

module.exports = {
  env,
  isProduction,
  port: readPositiveInt('PORT', 3000),
  pin,
  uploadDir: path.resolve(readString('UPLOAD_DIR') || path.join(__dirname, 'uploads')),
  dataFile: path.resolve(readString('DATA_FILE') || path.join(__dirname, 'data.json')),
  sessionSecret,
  sessionName: readString('SESSION_NAME') || 'some_transfer.sid',
  maxFileSizeBytes: readPositiveInt('MAX_FILE_SIZE_BYTES', 100 * 1024 * 1024),
  bodyLimit: readString('BODY_LIMIT') || '64kb',
  loginWindowMs: readPositiveInt('LOGIN_WINDOW_MS', 15 * 60 * 1000),
  loginMaxAttempts: readPositiveInt('LOGIN_MAX_ATTEMPTS', 5),
  trustProxy: readString('TRUST_PROXY') === 'true'
};
