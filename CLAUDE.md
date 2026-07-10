## サブエージェント委譲ルール(RhythMark固有)
- app.json / eas.json / package.json 等の設定ファイルの整合性検証は
  @json-validator に委譲する(読み取り専用・haiku)
- 仕様が明確な実装・定型修正は @implementer に委譲する(sonnet)
- タイマー精度、オーディオセッション(mixWithOthers等)、バックグラウンド動作の
  設計変更はメインセッションで行う(このアプリの核心機能のため)
- App Store / Google Play 申請に関わる設定変更は、まず計画を提示してから進める
- セッション開始時はまず git fetch && git status でorigin/mainとの差分を確認する
  (複数環境で作業しているため、古いローカル状態での作業を防ぐ)

## プロジェクトの前提
- バックエンドなし。完全ローカルで動作するインターバルタイマー
- バックグラウンド動作(音楽アプリとの併用)が最重要機能
- 既知の制約: タスクキル時のタイマー停止は仕様として許容
- 配布計画: TestFlight配布→通知方式(expo-notifications)実装→App Store本審査の順
