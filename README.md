# Some Transfer

一个轻量、自托管的私有文件与文本中转站，适合在个人局域网、家庭服务器或 NAS 上快速投递临时内容。

项目当前支持：

- Pin 码登录
- 文本内容投递
- 文件上传、下载、删除
- 图片文件在线预览
- 文本内容保留基础换行与空格排版
- 长文本行尾省略显示，复制时保留完整原文
- Docker / Docker Compose 部署

## 功能截图

- 登录页：`/public/login.html`
- 主面板：`/public/index.html`

## 技术栈

- Node.js
- Express
- express-session
- multer
- 原生 HTML / CSS / JavaScript

## 目录结构

```text
some-transfer/
├── public/
│   ├── assets/
│   │   └── app-icon.svg
│   ├── index.html
│   └── login.html
├── uploads/
├── config.js
├── server.js
├── store.js
├── Dockerfile
├── docker-compose.yml
├── build-and-run.sh
├── package.json
└── .env.example
```

## 运行要求

- Node.js 18 或更高版本
- npm

如果使用 Docker：

- Docker
- Docker Compose 或 `docker compose`

## 环境变量

项目通过环境变量控制运行参数，核心配置如下：

| 变量名 | 是否必填 | 说明 |
| --- | --- | --- |
| `APP_PIN` | 是 | 登录所需的 Pin 码 |
| `SESSION_SECRET` | 是 | Session 签名密钥，长度至少 32 个字符 |
| `PORT` | 否 | 服务监听端口，默认 `3000` |
| `UPLOAD_DIR` | 否 | 上传文件目录，默认 `./uploads` |
| `DATA_FILE` | 否 | 数据文件路径，默认 `./data.json` |
| `MAX_FILE_SIZE_BYTES` | 否 | 单文件最大体积，默认 `26214400` |
| `BODY_LIMIT` | 否 | 请求体大小限制，默认 `64kb` |
| `LOGIN_WINDOW_MS` | 否 | 登录限流时间窗口，默认 `900000` |
| `LOGIN_MAX_ATTEMPTS` | 否 | 限流窗口内最大尝试次数，默认 `5` |
| `TRUST_PROXY` | 否 | 是否信任反向代理，默认 `false` |
| `SESSION_NAME` | 否 | Session Cookie 名称，默认 `some_transfer.sid` |
| `NODE_ENV` | 否 | 运行环境，生产环境建议使用 `production` |

可以直接基于示例文件创建本地配置：

```bash
cp .env.example .env
```

## 本地开发

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env
```

至少需要修改：

- `APP_PIN`
- `SESSION_SECRET`

3. 启动服务

```bash
npm start
```

默认访问地址：

```text
http://localhost:3000
```

## Docker 部署

### 方式一：使用 Docker Compose

```bash
docker compose up -d --build
```

如果环境里仍使用旧版命令，也可以：

```bash
docker-compose up -d --build
```

默认映射：

- 宿主机 `7300`
- 容器内 `3000`

访问地址：

```text
http://localhost:7300
```

### 方式二：使用一键脚本

```bash
chmod +x build-and-run.sh
./build-and-run.sh
```

脚本会自动：

- 检查 `.env`
- 创建持久化目录
- 构建镜像
- 启动容器

## 数据存储说明

- 文本和文件元数据保存在 `DATA_FILE`
- 上传的文件本体保存在 `UPLOAD_DIR`
- 默认本地开发使用 `./data.json` 与 `./uploads`
- Docker 部署时通过挂载卷保存到宿主机目录

项目里的这些内容属于运行时数据，不建议提交到 Git 仓库：

- `.env`
- `data.json`
- `uploads/`
- `node_modules/`

## 文本排版行为

文本投递区域支持保留基础排版：

- 保留换行
- 保留基础空格
- 提交时不会裁掉原文内容
- 文本卡片中超长单行会以省略号显示，避免打乱布局
- 点击“展开全文”后会显示更多行，但超长单行仍保持省略
- 点击“复制文本”时复制的是完整原文

当前交互更适合“复制 -> 粘贴 -> 回车发送”的使用方式。

## 安全特性

项目已经包含一些基础安全配置：

- Session 登录态校验
- 登录失败限流
- `timingSafeEqual` 比较 Pin
- 常见安全响应头
- `Content-Security-Policy`
- 文件名规范化与路径保护

如果对公网开放，建议额外配合：

- HTTPS
- 反向代理
- 更强的访问控制
- 更长、更随机的 `APP_PIN`
- 定期轮换 `SESSION_SECRET`

## 常用操作

启动：

```bash
npm start
```

开发模式：

```bash
npm run dev
```

查看 Docker 日志：

```bash
docker compose logs -f
```

停止 Docker 服务：

```bash
docker compose down
```

## 发布到 GitHub 前建议

在推送到 GitHub 之前，建议确认：

- `.env` 没有被提交
- `data.json` 没有被提交
- `uploads/` 没有被提交
- 本地测试已经通过
- README 中的部署说明与你的实际使用方式一致

## License

如果你准备公开发布，建议补充一个 `LICENSE` 文件，例如 MIT License。
