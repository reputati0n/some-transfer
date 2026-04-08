# Some Transfer

轻量、自托管的私有文件与文本中转站。

## 功能特性

- **文本投递**: 快速发送文本片段，保留换行格式
- **文件上传**: 单文件最大 100MB（可配置）
- **图片预览**: 内置大图查看器
- **PIN 登录**: 简单认证，无需注册
- **响应式界面**: 适配桌面与移动端

## 快速开始

### 本地运行

```bash
npm install
cp .env.example .env
# 编辑 .env 设置 APP_PIN 和 SESSION_SECRET
npm start
```

访问 http://localhost:3000

### Docker 部署

```bash
docker compose up -d --build
```

访问 http://localhost:7300

**持久化**: `uploads/` 和 `data/` 目录会自动挂载到宿主机。

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `APP_PIN` | 是 | 登录 PIN 码，建议 8 位以上 |
| `SESSION_SECRET` | 是 | Session 密钥，至少 32 位 |
| `PORT` | 否 | 端口，默认 3000 |
| `MAX_FILE_SIZE_BYTES` | 否 | 最大文件体积，默认 100MB |

完整配置见 [.env.example](.env.example)

## 数据存储

- 文本元数据: `data.json`
- 上传文件: `uploads/`

## License

[MIT License](LICENSE)
