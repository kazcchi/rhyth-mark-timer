#!/bin/bash
# 無料Apple IDでの実機ビルド用スクリプト。
# 7日ごとの署名切れに対応するため -allowProvisioningUpdates を付けて再ビルドする。
set -e

cd "$(dirname "$0")/../ios"

echo "接続中のiPhoneを検索しています..."
DEVICE_LINE=$(xcrun devicectl list devices 2>/dev/null | grep "available (paired)" | head -1)

if [ -z "$DEVICE_LINE" ]; then
  echo "エラー: ペアリング済みで利用可能なiPhoneが見つかりません。"
  echo "USBまたはWi-Fiで接続し、Xcodeで信頼設定済みか確認してください。"
  exit 1
fi

DEVICE_ID=$(echo "$DEVICE_LINE" | awk '{print $3}')
DEVICE_NAME=$(echo "$DEVICE_LINE" | awk '{print $1}')
echo "対象デバイス: $DEVICE_NAME ($DEVICE_ID)"

echo "ビルド中(署名切れの場合は自動で再生成します)..."
# ReleaseビルドはJSバンドルをアプリ内に同梱するため、
# Mac側でMetro(expo start)を起動していなくてもiPhone単体で動作する。
xcodebuild -workspace RhythMark.xcworkspace \
  -scheme RhythMark \
  -configuration Release \
  -destination "id=$DEVICE_ID" \
  -allowProvisioningUpdates \
  build

DERIVED_DATA=$(xcodebuild -workspace RhythMark.xcworkspace -scheme RhythMark -configuration Release -showBuildSettings 2>/dev/null | grep -m1 "BUILT_PRODUCTS_DIR" | awk '{print $3}')
APP_PATH="$DERIVED_DATA/RhythMark.app"

echo "実機にインストール中..."
xcrun devicectl device install app --device "$DEVICE_ID" "$APP_PATH"

echo "アプリを起動中..."
if ! xcrun devicectl device process launch --device "$DEVICE_ID" com.murakamiworks.rhythmark; then
  echo ""
  echo "インストールは成功しましたが、起動に失敗しました。"
  echo "初回のみ、iPhone側で開発者を信頼する設定が必要です:"
  echo "  設定 > 一般 > VPNとデバイス管理 > 対象のデベロッパApp > 「信頼」"
  echo "信頼後、iPhoneのホーム画面からRhythMarkを手動で起動してください。"
  exit 0
fi

echo "完了: RhythMarkをiPhoneにインストール・起動しました。"
