# バグ: 強制スタート後に自分のボードが表示されない

**概要**
`forceStart`（30秒で自動開始）によりゲーム状態が `playing` に入った後、クライアント UI 上で「観戦モード」「ゲームオーバー」になり、メインの `TetrisBoard` が描画されない。

**再現手順**
1. `pnpm dev:backend` + `pnpm dev:frontend` を起動して環境を整える。バックエンドは `Room` の強制スタート処理を有効にしておく（`firstJoinTimestamp` から 30 秒経過で `forceStart` を呼ぶ）。
2. フロントエンドでルームを作成して 30 秒間何もしない。
3. 強制スタートアラートがブラウザに表示される。
4. `roomUpdated`/`gameState` イベント（`state: "playing"`, `isActive: true`）は届いているが、画面は観戦モードのままでテトリスボードが空白になる。

**実際の挙動**
- `roomUpdated` の `players` に自分の `userId` 含まれているにも関わらず `GameRoom` は `isSpectator` を `true` に切り替え、ボードもキーボード操作も無効になる。DevTools の `gameState` には `board` / `currentPiece` / `nextPiece` が入っているため、必要なデータ自体はサーバーから届いている。

**期待される挙動**
- 強制スタート後、自分の `playerId` に対応する `gameState` が受信されると同時に `GameRoom` で `isSpectator` を `false` に保ち、自分のボード（`TetrisBoard`）を表示すべき。

**参考ログ**
```
[FORCE START] room: acd9e7cb-1666-4838-add4-9970413dc56b (テトリス部屋) 30秒経過で強制スタート
42["roomUpdated",{"id":"acd9e7cb-1666-4838-add4-9970413dc56b","state":"playing","players":[{"id":"e4424a9b-de62-4284-a83b-bc0fcf633a17","username":"aaaa","isReady":true}],...}]
42["gameState",{"id":"843c0908-c29b-4cc8-aeee-98c7a03061f4","players":{"e4424a9b-de62-4284-a83b-bc0fcf633a17":{"board":...,"currentPiece":{"type":"L","position":{"x":4,"y":0},"rotation":0},...}},"isActive":true,...}]
```

**考えられる原因**
- `GameRoom` が `roomUpdated` の `players` を参照して `isSpectator` を決定しているが、強制スタート直後に `roomInfo.players` が空（またはまだ更新されていない）状態のまま `isSpectator` が切り替わってしまい、その後 `gameState` を受信しても `isSpectator` を `false` に戻さない。`roomUpdated` と `gameState` の受信順に依存するロジックになっている可能性。

**次のアクション**
1. `GameRoom` の `isSpectator` 判定を `roomUpdated` だけでなく `gameState.players` の中にも存在確認を含める。少なくとも `gameState.players[userId]` が存在すればプレイヤー扱いにする。  
2. `roomInfo.players` が空のまま本文が `playing` になった状態でも `GameRoom` が自動的に `isSpectator` を更新するようにする（受信順に関わらず）。
3. 再現手順を追って、`roomUpdated` が空でも `gameState` でボード描画が呼び出されることを確認。

---
記録: 2025-12-02 にデバッグ時点でのログ/スクリーンショット参照。
