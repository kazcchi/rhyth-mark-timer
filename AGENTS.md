# RhythMark(rhyth-mark-timer)

ウォーキング／インターバルトレーニング用タイマーアプリ(Expo / React Native)。Apple Music などの音楽を止めずに Work/Rest 切替時のビープを重ねて鳴らし、画面ロック中・ポケットの中でも動く。バックエンドなし、完全ローカル動作。

## 言語ポリシー
- 以後のやり取りは必ず日本語で行う
- コード識別子や外部仕様上で英語必須な場合を除き、日本語を優先する
- 例外が必要な場合はPRで合意を取る

## 運用ルール(Claude Code / Codex 共通・最初に読む)
- **正本はこの `AGENTS.md`**。`CLAUDE.md` はここへのシンボリックリンク。編集はこのファイルに対して行う
- **進行状態は `HANDOFF.md` だけに書く**(待ち事項・次にやること・直近の決定)。このファイルには手順とルールだけを書く
- 日付ごとの引き継ぎファイルを増やさない。詳細ログが要るときは `docs/worklog/YYYY-MM-DD.md` に置き、`HANDOFF.md` からリンクする
- リモートは GitHub **public** `kazcchi/rhyth-mark-timer`(Web版を GitHub Pages で公開しているため public のまま)。Mac mini と MacBook Air の2台運用。開始時 pull・終了時 push、同時作業はしない
- **セッション開始時はまず `git fetch && git status` で origin/main との差分を確認する**(複数環境で作業しているため、古いローカル状態での作業を防ぐ)
- 鍵・証明書(`*.p8` `*.p12` `*.mobileprovision` 等)は git 管理外(`.gitignore` 済み)。値を表示・出力しない
- 「最新にして」「終了処理して」の手順は全体設定(Claude: `~/.claude/CLAUDE.md` / Codex: `~/.codex/AGENTS.md`)のとおり

## サブエージェント委譲ルール(RhythMark固有)
- app.json / eas.json / package.json 等の設定ファイルの整合性検証は @json-validator に委譲する(読み取り専用・haiku)
- 仕様が明確な実装・定型修正は @implementer に委譲する(sonnet)
- タイマー精度、オーディオセッション(mixWithOthers等)、バックグラウンド動作の設計変更はメインセッションで行う(このアプリの核心機能のため)
- App Store / Google Play 申請に関わる設定変更は、まず計画を提示してから進める

## プロジェクトの前提
- バックエンドなし。完全ローカルで動作するインターバルタイマー
- バックグラウンド動作(音楽アプリとの併用)が最重要機能
- 既知の制約: タスクキル時のタイマー停止は仕様として許容
- 配布計画: TestFlight配布 → 通知方式(expo-notifications)実装 → App Store本審査の順
- 審査リスク: 無音ループによるバックグラウンド維持はガイドライン2.5.4のリジェクト定番。リジェクト時はローカル通知方式へ切り替える
- Bundle ID は法人名義 `com.murakamiworks.rhythmark`(iOS/Android共通)。App Store初回アップロード後は変更不可
- 申請用URL(法人サイトで公開済み): プライバシー https://www.murakamiworks.co.jp/apps/rhythmark/privacy / サポート https://www.murakamiworks.co.jp/apps/rhythmark/support
- `public/privacy.html` `public/support.html` を直しても法人サイトには自動反映されない。反映経路の確認・反映作業が別途必要

## 触らない範囲(凍結)
- なし(2026-09-10時点。App Store申請中になったら申請対象ビルドの設定を凍結する)

## 技術・構成
- Expo SDK 56 / React Native 0.85 / TypeScript 6 / Node 20(`.node-version`)
- expo-audio: `mixWithOthers` で音楽を止めずにビープを混合。バックグラウンド維持は `UIBackgroundModes: audio` + 無音ループ再生(タイマー作動中のみ)
- タイマーは終了時刻タイムスタンプ基準(ロック中も正確)。バイブは RN 標準 `Vibration.vibrate()`(着信と同じ強度)
- フォルダ構成:
  - `App.tsx` `index.ts` — エントリ
  - `screens/` — TimerScreen / SettingScreen
  - `components/` — NumberPicker
  - `utils/` — AudioPlayer / SettingsContext / storage / colors
  - `assets/` — アイコン・スプラッシュ・`audio/`(ビープ音)
  - `public/` — プライバシーポリシー・サポートページ(HTML)
  - `docs/appstore/screenshots/` — App Store 用 6.9インチ スクリーンショット6枚(1320×2868)
  - `docs/worklog/` — 日付ごとの作業ログ
  - `scripts/build-device.sh` — 無料署名での実機ビルド・インストール・起動
  - `ios/` — `npx expo prebuild` の生成物で git 管理外。`prebuild --clean` すると Xcode の Team 設定が消えるので注意
- 無料 Apple ID(Personal Team)署名は7日で期限切れ。**週1回 `npm run device`** で再ビルド(署名切れは `-allowProvisioningUpdates` で自動再生成)。法人の Apple Developer Program は契約済みで、TestFlight 以降は EAS(`npx eas-cli build/submit`)を使う
- Web版: `npx expo start --web`。GitHub Pages で公開(`dist/` は git 管理外、Actions の pages build が配信)

## 検証方法
- 型チェック: `npx tsc --noEmit`(0エラーを維持)
- 設定ファイル検証: app.json / eas.json / package.json の整合性を json-validator で確認(Bundle ID が両OSで一致していること)
- 実機確認: iPhone を接続して `npm run device`。フォアグラウンド・画面ロック中の両方でビープと振動が鳴ること、音楽再生を止めないことを確認
- 初回のみ iPhone 側で 設定 > 一般 > VPNとデバイス管理 > デベロッパApp > 「信頼」が必要
