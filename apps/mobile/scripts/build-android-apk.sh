#!/usr/bin/env bash
set -euo pipefail

npx expo prebuild --platform android --clean --no-install
node scripts/configure-android-signing.mjs
cd android
./gradlew assembleRelease
