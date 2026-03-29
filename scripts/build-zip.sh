#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
npm run build
VERSION=$(node -p "require('./package.json').version")
ZIP_NAME="prevent-duplicate-tabs-${VERSION}.zip"
mkdir -p build
rm -f build/prevent-duplicate-tabs-*.zip
cd dist && zip -r "../build/${ZIP_NAME}" . && cd ..
echo "Created build/${ZIP_NAME}"
