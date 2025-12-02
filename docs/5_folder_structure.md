# フォルダ・ファイル構成設計

以下が最終的なプロジェクト構成例と各フォルダ・ファイルの役割です。

```
/
├─ .gitignore              # Git管理除外設定
├─ README.md               # プロジェクト概要 & 起動手順
├─ .env.example            # 環境変数テンプレート
├─ docker-compose.yml      # 開発用コンテナ構成
├─ docs/                   # ドキュメント
│  ├─ 0_task_overview.md
│  ├─ 1_requirements_prd.md
│  ├─ 2_user_journey.md
│  ├─ 3_tech_stack.md
│  ├─ 4_architecture_design.md
│  └─ 5_folder_structure.md
├─ frontend/               # Next.js フロントエンド
│  ├─ Dockerfile
│  ├─ next.config.js
│  ├─ tailwind.config.js
│  ├─ tsconfig.json
│  ├─ package.json
│  ├─ public/              # 静的アセット
│  └─ src/
│     ├─ app/
│     │  ├─ layout.tsx     # 共通レイアウト
│     │  ├─ globals.css    # グローバルスタイル
│     │  └─ page.tsx       # ルーム一覧 / ルーティング
│     ├─ components/       # UI コンポーネント
│     │  ├─ GameRoom.tsx
│     │  ├─ TetrisBoard.tsx
│     │  ├─ TetrisGame.tsx
│     │  └─ MiniBoard.tsx
│     ├─ hooks/            # カスタムフック
│     │  └─ useKeyboardControls.ts
│     └─ lib/              # ユーティリティ・定数
│        └─ tetrominos.ts
├─ backend/                # Node.js + Express + Socket.IO
│  ├─ Dockerfile
│  ├─ tsconfig.json
│  ├─ package.json
│  └─ src/
│     ├─ index.ts          # エントリーポイント
│     ├─ socket/
│     │  └─ handlers.ts    # WebSocket イベント定義
│     ├─ room/
│     │  ├─ Room.ts        # 部屋モデル
│     │  └─ RoomManager.ts # 部屋管理ロジック
│     ├─ game/
│     │  ├─ TetrisGame.ts  # ゲーム進行管理
│     │  ├─ GameState.ts
│     │  ├─ Piece.ts
│     │  ├─ ScoreCalculator.ts
│     │  └─ PenaltyManager.ts
│     └─ tests/            # バックエンド テスト
│        └─ *.spec.ts
├─ .github/                # GitHub Actions CI/CD
│  └─ workflows/
│     └─ ci.yml
└─ tests/                  # フロントエンド テスト
   └─ *.spec.ts
```

- docs/: 要件定義から設計までのドキュメント一式  
- frontend/: Next.js “app router” 構成。UI とデータフェッチ（Suspense/SWR）  
- backend/: Express + Socket.IO サーバー。ゲームロジックと部屋管理  
- tests/: Vitest / Jest などのテストファイル  
- .github/workflows/ci.yml: CI（Lint・テスト・カバレッジ）  
- docker-compose.yml: local 開発時にフロント/バックエンド起動  

以上の構成で開発を進めます。
