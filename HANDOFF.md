# HANDOFF.md — 進行状態(Claude Code / Codex 共通)

**終了処理のたびにこのファイルを更新する。開始処理のたびに最初に読む。** 手順・ルールは `AGENTS.md`、ここは「いまどこまで来ていて、次に何をするか」だけ。

最終更新: 2026-09-10(Claude Code)

## 待ち事項・保留アラート
- **TestFlight配布 Phase B-1 Step 1 がユーザー側で未報告(2026-07-10から継続)**。App Store Connect 側の手作業(developer.apple.com で Bundle ID 登録 → ASC で App 作成、名前 RhythMark・日本語・SKU rhythmark)を済ませ、次の3値を報告してもらう: Team ID(英数10桁)/ ascAppId(ASC の App 情報ページ「Apple ID」、数字)/ Apple Account メール
- **実機の無料署名は7日で切れる**。最後の実機ビルドは 2026-07-13。次に実機で使う前に `npm run device` が必要(約2か月経過しているので確実に切れている)
- privacy.html の文言修正(2026-07-10 承認済み・未実施): 「個人情報を収集しません」→「いかなるデータも収集しません」(英語も "any data" へ)、最終更新日を更新。リポジトリ修正後、法人サイトへの反映経路を確認して反映する

## 次にやること
1. Step 1 の3値を受け取ったら Step 2: `eas.json` の `submit.production.ios`(appleId / ascAppId / appleTeamId)を設定し、`app.json` の `ios.infoPlist` に `ITSAppUsesNonExemptEncryption: false` を追加(承認済み)。json-validator で検証してコミット
2. Step 3: `npx eas-cli build --platform ios --profile production`(認証: Expo ログイン、Apple ID+2FA)
3. Step 4: `npx eas-cli submit --platform ios --latest`(認証: ASC API Key 生成)。提出後5〜30分で TestFlight に出現
4. Step 5(ユーザー): TestFlight で内部グループ作成 → 自分をテスター追加 → ビルド割当 → iPhone にインストール(有効期限90日)
5. 並行: privacy.html 文言修正を implementer に委譲(いつでも実施可)
6. TestFlight 後: 通知方式(expo-notifications)の実装 → App Store 本審査

## 直近の決定
- 2026-09-10: デュアル化(AGENTS.md を正本に統合、CLAUDE.md はシンボリックリンク、進行状態は本ファイルへ)。リポジトリは GitHub Pages 配信のため public のまま
- 2026-07-13: 実機ビルドは `npm run device`(`scripts/build-device.sh`)に一本化。Release 構成で JS バンドルを同梱し Metro なしで単体動作
- 2026-07-10: `ITSAppUsesNonExemptEncryption: false` 追加と privacy.html 文言修正を承認。TestFlight 配布計画(Step 1〜5)を確定
- 2026-07-04: Bundle ID を法人名義 `com.murakamiworks.rhythmark` に変更。バイブを `Vibration.vibrate()` に切替。無音ループがリジェクトされたらローカル通知方式へ

## 作業ログ(詳細)
- [2026-07-13](docs/worklog/2026-07-13.md) 実機ビルド署名切れ対応と `npm run device` 整備
- [2026-07-10](docs/worklog/2026-07-10.md) CLAUDE.md 整備(Phase A)と TestFlight 配布計画
- [2026-07-04](docs/worklog/2026-07-04.md) バイブ強化・Bundle ID 変更・App Store 申請準備

## 備考
- 親フォルダ `/Volumes/DATA_SSD/projects/Rhythmark/` 直下にスクリーンショット6枚と icon1〜3.png があるが git 管理外(スクリーンショットは `docs/appstore/screenshots/` に同じものをコミット済み)
