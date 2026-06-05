#!/bin/bash

# 文件分享系统 Docker 一键构建和运行脚本

set -e

echo "========================================"
echo "  文件分享系统 Docker 构建脚本"
echo "========================================"
echo ""

DEFAULT_APPDATA_ROOT="/mnt/user/appdata/some-transfer"
PROJECT_ENV_FILE=".env"
APP_ENV_FILE="${APP_ENV_FILE:-}"

if [ -z "${APP_ENV_FILE}" ]; then
    if [ -f "${PROJECT_ENV_FILE}" ]; then
        set -a
        . "${PROJECT_ENV_FILE}"
        set +a
        APPDATA_ROOT="${APPDATA_ROOT:-${DEFAULT_APPDATA_ROOT}}"
        APP_ENV_FILE="${APPDATA_ROOT}/.env"

        if [ ! -f "${APP_ENV_FILE}" ]; then
            mkdir -p "${APPDATA_ROOT}"
            cp "${PROJECT_ENV_FILE}" "${APP_ENV_FILE}"
            echo "已将 ${PROJECT_ENV_FILE} 初始化到宿主机配置: ${APP_ENV_FILE}"
        fi
    else
        APPDATA_ROOT="${APPDATA_ROOT:-${DEFAULT_APPDATA_ROOT}}"
        APP_ENV_FILE="${APPDATA_ROOT}/.env"
    fi
fi

if [ ! -f "${APP_ENV_FILE}" ]; then
    echo "错误: 缺少宿主机 .env 配置文件: ${APP_ENV_FILE}"
    echo "请先执行:"
    echo "  mkdir -p ${APPDATA_ROOT:-${DEFAULT_APPDATA_ROOT}}"
    echo "  cp .env.example ${APP_ENV_FILE}"
    echo "然后编辑 APP_PIN 与 SESSION_SECRET。"
    exit 1
fi

set -a
. "${APP_ENV_FILE}"
set +a

APPDATA_ROOT="${APPDATA_ROOT:-/mnt/user/appdata/some-transfer}"
APP_VERSION="${APP_VERSION:-v0.1.1}"
PUID="${PUID:-99}"
PGID="${PGID:-100}"
export APPDATA_ROOT APP_VERSION PUID PGID HOST_PORT DOCKER_IMAGE

echo "0. 准备持久化目录..."
mkdir -p "${APPDATA_ROOT}/uploads" "${APPDATA_ROOT}/data"
chown -R "${PUID}:${PGID}" "${APPDATA_ROOT}"
echo "配置文件: ${APP_ENV_FILE} -> /app/.env"

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: Docker 未安装，请先安装 Docker"
    exit 1
fi

# 检查 Docker Compose 是否安装
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE=(docker compose --env-file "${APP_ENV_FILE}")
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE=(docker-compose --env-file "${APP_ENV_FILE}")
else
    echo "错误: Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "1. 停止旧容器（如果存在）..."
"${DOCKER_COMPOSE[@]}" down 2>/dev/null || true

echo ""
echo "2. 构建 Docker 镜像..."
"${DOCKER_COMPOSE[@]}" build --no-cache

echo ""
echo "3. 启动容器..."
"${DOCKER_COMPOSE[@]}" up -d

echo ""
echo "========================================"
echo "  部署成功！"
echo "========================================"
echo ""
echo "访问地址: http://localhost:${HOST_PORT:-7300}"
echo "当前版本: ${APP_VERSION}"
echo ""
echo "常用命令:"
echo "  查看日志: docker-compose logs -f"
echo "  停止服务: docker-compose down"
echo "  重启服务: docker-compose restart"
echo ""
