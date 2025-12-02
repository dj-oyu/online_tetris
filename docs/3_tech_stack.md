# 技術構成と依存ライブラリ一覧

## 1. フロントエンド
- フレームワーク：Next.js (React)  
- 言語：TypeScript  
- スタイル：Tailwind CSS  
- データフェッチ：React Suspense + SWR  
- 状態管理：React Context + Suspense  
- WebSocket：Socket.IO クライアント  
- バンドラ：Vercel 最適化ビルド  
- 理由：  
  - 開発速度：Next.js の自動ルーティングとビルド最適化  
  - レイテンシー：Suspense＋SWR でデータ取得を並行化  
  - 学習コスト：React エコシステムへの親和性高い  

## 2. バックエンド
- ランタイム：Node.js (16.x+)  
- フレームワーク：Express + Socket.IO  
- 言語：TypeScript  
- デプロイ：AWS Fargate（コンテナ）  
- サーバレス機能：AWS Lambda（スコア集計／アラート）  
- 理由：  
  - 拡張性：コンテナ横スケール・Lambda のイベント駆動  
  - 運用コスト：Fargate でリソース自動調整、Lambda で従量課金  

## 3. データベース／キャッシュ
- メイン DB：Amazon DynamoDB  
- キャッシュ／セッション：Amazon ElastiCache (Redis)  
- 理由：  
  - レイテンシー：Redis で高速ステート管理  
  - スケーラビリティ：DynamoDB の自動スケール  

## 4. テスト
- ユニット／統合テスト（フロント）：Vitest + React Testing Library  
- ユニット／統合テスト（バック）：Jest + Supertest  
- カバレッジ：coverage/lcov-report  

## 5. CI/CD
- リポジトリ：GitHub  
- ワークフロー：GitHub Actions  
  - インストール：pnpm install  
  - リント：pnpm run lint (ESLint + Prettier)  
  - テスト：pnpm run test  
  - カバレッジアップロード  
- ブランチ戦略：feature/*, fix/* → main  

## 6. インフラ（AWS）
- ネットワーク：VPC + ALB  
- コンテナ：ECS Fargate (backend)  
- サーバレス：API Gateway WebSocket + Lambda (オプション)  
- ストレージ：S3 (静的ファイル／アセット)  
- ロギング：CloudWatch Logs + X-Ray (トレーシング)  
- インフラ管理：Terraform（別リポジトリ）  

---
