#!/bin/bash
set -e
echo "Building iOS release..."
cd "$(dirname "$0")/.."
flutter build ios --release \
  --dart-define=API_BASE_URL=${API_BASE_URL:-https://api.example.com/api/v1}
echo "Output: build/ios/iphoneos/Runner.app"
echo "To create IPA: xcodebuild -exportArchive ..."
