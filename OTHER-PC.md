# 別のWindows PCで開発を続ける

GitHubのこのリポジトリをGitまたはGitHub Desktopで複製してください。

```powershell
git clone <リポジトリURL>
cd <複製されたフォルダー>
npm ci
npm test
npm start
```

Node.js 22.12以降または24 LTSが必要です。作業を始める前に `git pull --ff-only` で最新の変更を取得します。作業後は `git add .`、`git commit -m "Describe your changes"`、`git push` で保存してください。

GitHubに保存する対象はコードと手順書です。アプリのタスク、音声、自動起動などの個人設定は各PCに保存されます。詳しい起動とインストーラー作成手順はREADME.mdにあります。
