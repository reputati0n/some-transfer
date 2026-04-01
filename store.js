const fs = require('fs');
const path = require('path');
const config = require('./config');

const DATA_FILE = config.dataFile;
const DATA_DIR = path.dirname(DATA_FILE);

let items = [];

function isValidItem(item) {
  if (!item || typeof item !== 'object') {
    return false;
  }

  if (typeof item.id !== 'string' || typeof item.timestamp !== 'string') {
    return false;
  }

  if (item.type === 'text') {
    return typeof item.content === 'string';
  }

  if (item.type === 'file') {
    return typeof item.filename === 'string' &&
      typeof item.filepath === 'string' &&
      Number.isFinite(item.size);
  }

  return false;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// 加载数据
function loadData() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(data);
      items = Array.isArray(parsed) ? parsed.filter(isValidItem) : [];
      console.log(`已加载 ${items.length} 条数据`);
    } else {
      items = [];
      console.log('数据文件不存在，创建新数据库');
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    items = [];
  }
  return getAll();
}

// 保存数据
function saveData() {
  try {
    ensureDataDir();
    const tempFile = `${DATA_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(items, null, 2), 'utf8');
    fs.renameSync(tempFile, DATA_FILE);
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
}

// 获取所有项目
function getAll() {
  return [...items];
}

// 添加项目
function add(item) {
  items.push(item);
  saveData();
  return item;
}

// 删除项目
function remove(id) {
  const index = items.findIndex(item => item.id === id);
  if (index !== -1) {
    const item = items[index];
    items.splice(index, 1);
    saveData();
    return item;
  }
  return null;
}

// 获取单个项目
function getById(id) {
  return items.find(item => item.id === id) || null;
}

// 通过上传后的文件名获取单个项目
function getByStoredFilename(filename) {
  return items.find(item => item.type === 'file' && item.filepath === filename) || null;
}

// 初始化加载
loadData();

module.exports = {
  getAll,
  add,
  remove,
  getById,
  getByStoredFilename,
  loadData,
  saveData
};
