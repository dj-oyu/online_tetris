# Online Tetris

開発セットアップを `pnpm` ワークスペースで統一しました。プロジェクトルートで 1 回 `pnpm install` すればフロントエンド・バックエンドの依存関係がまとめて入ります。

## 前提
- Node.js 18+
- pnpm 9 系（例: `pnpm@9.14.4`）

## セットアップ
```bash
pnpm install
```
上記をプロジェクトルートで実行すると、ルートに `pnpm-lock.yaml` が生成され、`frontend` / `backend` の依存関係がすべてインストールされます。

## よく使うスクリプト
- `pnpm dev`: フロントエンドとバックエンドの開発サーバーを並列起動
- `pnpm dev:frontend` / `pnpm dev:backend`: それぞれ単体で起動
- `pnpm build`: バックエンド→フロントエンドの順にビルド
- `pnpm test`: バックエンド→フロントエンドの順にテスト
- `pnpm lint`: フロントエンドの lint

## メモ
- `frontend` / `backend` に残っている `package-lock.json` / 個別の `pnpm-lock.yaml` は互換のために残していますが、運用はルートの `pnpm-lock.yaml` に集約する想定です。
