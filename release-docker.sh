#!/bin/bash

# Build and push a release image to Docker Hub.

set -euo pipefail

DEFAULT_APPDATA_ROOT="/mnt/user/appdata/some-transfer"

source_env_file() {
    local env_file="$1"
    if [ ! -f "${env_file}" ]; then
        return
    fi

    set -a
    . "${env_file}"
    set +a
}

ENV_FILE="${APP_ENV_FILE:-.env}"
source_env_file "${ENV_FILE}"

APPDATA_ROOT="${APPDATA_ROOT:-${DEFAULT_APPDATA_ROOT}}"
HOST_ENV_FILE="${APPDATA_ROOT}/.env"
if [ "${HOST_ENV_FILE}" != "${ENV_FILE}" ]; then
    source_env_file "${HOST_ENV_FILE}"
fi

PACKAGE_VERSION="$(node -p "require('./package.json').version")"
if [[ "${PACKAGE_VERSION}" =~ ^([0-9]+)\.([0-9]+)\.0$ ]]; then
    DEFAULT_APP_VERSION="v${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"
else
    DEFAULT_APP_VERSION="v${PACKAGE_VERSION}"
fi

APP_VERSION="${APP_VERSION:-${DEFAULT_APP_VERSION}}"
DOCKER_IMAGE="${DOCKER_IMAGE:-}"
PLATFORMS="${PLATFORMS:-linux/amd64,linux/arm64}"

if [ -z "${DOCKER_IMAGE}" ] || [ "${DOCKER_IMAGE}" = "some-transfer" ]; then
    echo "错误: 请先设置 Docker Hub 镜像名，例如:"
    echo "  DOCKER_IMAGE=your-dockerhub-username/some-transfer APP_VERSION=${APP_VERSION} ./release-docker.sh"
    exit 1
fi

if ! docker buildx version >/dev/null 2>&1; then
    echo "错误: Docker buildx 不可用，请先安装或启用 Docker buildx"
    exit 1
fi

echo "构建并推送多架构镜像: ${DOCKER_IMAGE}:${APP_VERSION}"
echo "平台: ${PLATFORMS}"
docker buildx build \
    --platform "${PLATFORMS}" \
    --build-arg APP_VERSION="${APP_VERSION}" \
    -t "${DOCKER_IMAGE}:${APP_VERSION}" \
    -t "${DOCKER_IMAGE}:latest" \
    --push \
    .

echo "发布完成: ${DOCKER_IMAGE}:${APP_VERSION}"
echo "发布完成: ${DOCKER_IMAGE}:latest"
