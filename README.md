# Some Transfer

一个轻量、自托管的私有文件与文本中转站，适合在个人电脑、家庭服务器、局域网环境或 NAS 上快速投递临时内容。

它的目标很直接：用尽可能简单的方式，完成“发一段文字”或“传一个文件”这件事，同时保留基本可用的登录保护、图片预览和部署能力。

## 功能亮点

- Pin 码登录，无需注册
- 文本快速投递
- 文件上传、下载、删除
- 图片文件在线预览
- 文本内容保留基础换行与空格
- 超长文本行自动省略，保持卡片排版整洁
- 复制文本时保留完整原文
- 支持 Docker / Docker Compose 部署
- 适配桌面与移动端浏览器

## 适用场景

- 在自己设备之间临时传文本
- 在手机和电脑之间中转截图、文件、命令输出
- 在家庭网络里搭一个简单可用的私有投递页
- 在 NAS 或小主机上部署一个轻量的内部分享工具

## 技术栈

- Node.js
- Express
- express-session
- multer
- 原生 HTML / CSS / JavaScript

## 项目结构

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

## 快速开始

### 方式一：本地运行

1. 安装依赖

```bash
npm install
```

2. 创建环境变量文件

```bash
cp .env.example .env
```

3. 至少修改以下配置

- `APP_PIN`
- `SESSION_SECRET`

4. 启动服务

```bash
npm start
```

默认访问地址：

```text
http://localhost:3000
```

### 方式二：Docker Compose

```bash
docker compose up -d --build
```

如果你的环境仍使用旧版命令，也可以：

```bash
docker-compose up -d --build
```

默认端口映射：

- 宿主机：`7300`
- 容器：`3000`

默认访问地址：

```text
http://localhost:7300
```

### 方式三：一键脚本

```bash
chmod +x build-and-run.sh
./build-and-run.sh
```

脚本会自动完成：

- 检查 `.env` 是否存在
- 创建持久化目录
- 构建 Docker 镜像
- 启动容器

## 运行要求

### 本地运行

- Node.js 18 或更高版本
- npm

### Docker 部署

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

你可以直接基于示例文件生成本地配置：

```bash
cp .env.example .env
```

## 数据存储

- 文本内容和文件元数据保存在 `DATA_FILE`
- 上传的文件本体保存在 `UPLOAD_DIR`
- 本地开发默认使用 `./data.json` 和 `./uploads`
- Docker 部署通过挂载卷把数据保存在宿主机

这些内容属于运行时数据，不建议提交到 Git 仓库：

- `.env`
- `data.json`
- `uploads/`
- `node_modules/`

## 文本显示与排版说明

文本投递区域支持保留基础排版能力：

- 保留换行
- 保留基础空格
- 提交时不会裁掉原文内容
- 超长单行会以省略号显示，避免撑坏布局
- 点击“展开全文”会显示更多行数，但超长单行仍保持省略
- 点击“复制文本”复制的是完整原文

当前输入体验更适合这种使用方式：

```text
复制 -> 粘贴 -> 回车发送
```

## 安全说明

项目目前内置了基础安全措施：

- Session 登录态校验
- 登录失败限流
- `timingSafeEqual` 比较 Pin
- 常见安全响应头
- `Content-Security-Policy`
- 文件名规范化与路径保护

如果要对公网开放，建议额外配合：

- HTTPS
- 反向代理
- 更强的访问控制
- 更长、更随机的 `APP_PIN`
- 定期轮换 `SESSION_SECRET`

## 常用命令

启动项目：

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

## 发布建议

如果你准备把这个项目公开到 GitHub，建议在发布前确认：

- `.env` 没有被提交
- `data.json` 没有被提交
- `uploads/` 没有被提交
- README 的部署方式和你的实际使用方式一致
- 已补充合适的开源许可证

## License

当前仓库还没有附带 `LICENSE` 文件。

如果你准备开源发布，推荐补一个常见许可证，例如：

- MIT License
- Apache-2.0
- GPL-3.0
