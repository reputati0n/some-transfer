#!/bin/bash

# 文件分享系统 Docker 一键构建和运行脚本

set -e

echo "========================================"
echo "  文件分享系统 Docker 构建脚本"
echo "========================================"
echo ""

if [ ! -f ".env" ]; then
    echo "错误: 缺少 .env 配置文件"
    echo "请先基于 .env.example 创建 .env，并填写 APP_PIN 与 SESSION_SECRET"
    exit 1
fi

set -a
. ./.env
set +a

APPDATA_ROOT="${APPDATA_ROOT:-/mnt/user/appdata/some-transfer}"
PUID="${PUID:-99}"
PGID="${PGID:-100}"

echo "0. 准备持久化目录..."
mkdir -p "${APPDATA_ROOT}/uploads" "${APPDATA_ROOT}/data"
chown -R "${PUID}:${PGID}" "${APPDATA_ROOT}"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "1. 停止旧容器（如果存在）..."
docker-compose down 2>/dev/null || docker compose down 2>/dev/null || true

echo ""
echo "2. 构建 Docker 镜像..."
docker-compose build --no-cache || docker compose build --no-cache

echo ""
echo "3. 启动容器..."
docker-compose up -d || docker compose up -d

echo ""
echo "========================================"
echo "  部署成功！"
echo "========================================"
echo ""
echo "访问地址: http://localhost:7300"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
