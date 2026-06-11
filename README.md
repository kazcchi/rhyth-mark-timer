# RhythMark

ウォーキング／インターバルトレーニング用タイマー。
Apple Music などで音楽を聴きながらでも、Work/Rest の切り替わり時に**ビープ音を音楽に重ねて**鳴らします。画面ロック・ポケットの中でも動作します。

- Work → Rest 切替: ピッピッ（ダブルビープ）
- 全ラウンド終了: ピー（ロングビープ）
- マナーモード中でも鳴ります（イヤホン推奨）

## 技術構成

- Expo SDK 56 / React Native 0.85 / TypeScript
- expo-audio: `mixWithOthers` で音楽を止めずにビープを混合
- バックグラウンド維持: `UIBackgroundModes: audio` + 無音ループ再生（タイマー作動中のみ）
- タイマーは終了時刻タイムスタンプ基準なので、ロック中も正確

## 必要なもの（すべて無料）

1. **Xcode** — Mac App Store からインストール（容量大。初回起動でライセンス同意と iOS コンポーネント追加を済ませる）
2. **CocoaPods** — `brew install cocoapods`
3. **Node 20** （`.node-version` 参照）
4. 無料の Apple ID（普段使っているものでOK）

## 初回セットアップ

```bash
npm install
```

1. Xcode を起動 → Settings → Accounts → 自分の Apple ID でサインイン（Personal Team が作られる）
2. iPhone を USB 接続し、iPhone 側で「このコンピュータを信頼」
3. iPhone の 設定 → プライバシーとセキュリティ → デベロッパモード を ON（再起動を求められる）
4. 署名設定（初回のみ）:
   ```bash
   npx expo prebuild -p ios   # ios/ フォルダ生成（生成済みならスキップ）
   open ios/RhythMark.xcworkspace
   ```
   Xcode で RhythMark ターゲット → Signing & Capabilities → Team に「(自分の名前) Personal Team」を選択
5. ビルド & インストール:
   ```bash
   npx expo run:ios --device --configuration Release
   ```
   （`--configuration Release` にすると Mac の開発サーバーなしで単体動作するアプリになる）
6. 初回起動時に iPhone の 設定 → 一般 → VPNとデバイス管理 → 自分の Apple ID を「信頼」

## 週1回の更新（無料署名は7日で期限切れ）

アプリが起動しなくなったら、iPhone を Mac につないで再実行するだけ:

```bash
npx expo run:ios --device --configuration Release
```

設定データ（タイマー設定）は消えません。

## 開発

```bash
npx expo start        # 開発サーバー（web は --web）
npx tsc --noEmit      # 型チェック
```

`ios/` フォルダは `npx expo prebuild` で再生成できる成果物のため git 管理外。
**注意**: `ios/` を削除・`prebuild --clean` すると Xcode の Team 設定が消えるので、再度上記の署名設定が必要。

## 既知の制約

- 無料署名のため7日ごとに再インストールが必要（Apple Developer Program 加入で1年に延長＋TestFlight 配布可能）
- アプリを完全終了（タスクキル）するとタイマーも止まる。作動中はホームに戻る／画面ロックはOK
