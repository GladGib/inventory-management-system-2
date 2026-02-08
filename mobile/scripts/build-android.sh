#!/bin/bash
set -e
echo "Building Android release..."
cd "$(dirname "$0")/.."
flutter build appbundle --release \
  --dart-define=API_BASE_URL=${API_BASE_URL:-https://api.example.com/api/v1}
echo "Output: build/app/outputs/bundle/release/app-release.aab"
