# Some Transfer

轻量、自托管的私有文件与文本中转站。

当前版本: `v0.1.3`

## 功能特性

- **文本投递**: 快速发送文本片段，保留换行格式
- **文本加密传输**: 文本加密，防止内容检测，适用某些通过 WAF 暴露公网的场景，请优先启用 HTTPS
- **文件上传**: 单文件最大 100MB（可配置）
- **图片预览**: 内置大图查看器
- **批量清空**: 一键清空全部文本和文件记录
- **PIN 登录**: 简单认证，无需注册
- **登录锁定**: 在指定时间窗口内连续输错 PIN 达到阈值后自动锁定登录
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

#### 使用 Docker Hub 镜像

已发布的镜像支持 `linux/amd64` 和 `linux/arm64`:

```bash
docker pull reputati0n/some-transfer:v0.1.2
```

推荐的持久化目录:

```text
宿主机路径                                  容器路径
/mnt/user/appdata/some-transfer/.env       /app/.env
/mnt/user/appdata/some-transfer/data       /app/data
/mnt/user/appdata/some-transfer/uploads    /app/uploads
```

宿主机 `.env` 中必须使用容器内路径，否则旧数据不会从挂载目录读取:

```env
UPLOAD_DIR=/app/uploads
DATA_FILE=/app/data/data.json
```

#### 使用 Docker Compose

```bash
mkdir -p /mnt/user/appdata/some-transfer
cp .env.example /mnt/user/appdata/some-transfer/.env
# 编辑 /mnt/user/appdata/some-transfer/.env 设置 APP_PIN 与 SESSION_SECRET
docker compose --env-file /mnt/user/appdata/some-transfer/.env up -d --build
```

访问 http://localhost:7300，或使用 `.env` 中的 `HOST_PORT` 自定义宿主机端口。

**持久化**: `.env`、`uploads/` 和 `data/` 都在宿主机 `APPDATA_ROOT` 下。容器会把 `${APPDATA_ROOT}/.env` 只读挂载到 `/app/.env`。

也可以直接使用脚本，它会把项目根目录已有的 `.env` 初始化到宿主机配置路径:

```bash
./build-and-run.sh
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `APP_PIN` | 是 | 登录 PIN 码，建议 8 位以上 |
| `SESSION_SECRET` | 是 | Session 密钥，至少 32 位 |
| `APP_VERSION` | 否 | 前端页脚展示版本，当前默认 `v0.1.2` |
| `PORT` | 否 | 端口，默认 3000 |
| `HOST_PORT` | 否 | Docker 部署映射到宿主机的端口，默认 7300 |
| `APPDATA_ROOT` | 否 | Docker 部署的宿主机持久化目录 |
| `DOCKER_IMAGE` | 否 | Docker 镜像名；发版到 Docker Hub 时设为真实仓库名 |
| `PLATFORMS` | 否 | Docker Hub 发版平台，默认 `linux/amd64,linux/arm64` |
| `MAX_FILE_SIZE_BYTES` | 否 | 最大文件体积，默认 100MB |
| `LOGIN_WINDOW_MS` | 否 | 统计登录失败次数的时间窗口，默认 15 分钟 |
| `LOGIN_MAX_ATTEMPTS` | 否 | 连续输错多少次后锁定，默认 5 |
| `LOGIN_LOCK_MS` | 否 | 锁定时长，默认 24 小时 |

完整配置见 [.env.example](.env.example)

## 数据存储

- Docker 部署文本元数据: `/app/data/data.json`
- Docker 部署上传文件: `/app/uploads/`
- 默认宿主机持久化目录: `/mnt/user/appdata/some-transfer`
- 本地开发可将 `UPLOAD_DIR` 和 `DATA_FILE` 改为 `./uploads` 与 `./data.json`

## License

[MIT License](LICENSE)
