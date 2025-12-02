import { PlayerState } from './GameState';

export class PenaltyManager {
  // ペナルティ対象プレイヤーを選択する
  selectTarget(
    sourcePlayerId: string,
    activePlayers: string[],
    players: Record<string, PlayerState>
  ): string | null {
    // 対象となるアクティブプレイヤー（自分以外）がいない場合はnullを返す
    const eligiblePlayers = activePlayers.filter(id => id !== sourcePlayerId);
    if (eligiblePlayers.length === 0) return null;
    
    // ソースプレイヤーのスコアを取得
    const sourceScore = players[sourcePlayerId].score;
    
    // スコアに基づく重み付けを計算
    const weightedPlayers = eligiblePlayers.map(playerId => {
      const playerScore = players[playerId].score;
      const scoreDiff = Math.abs(sourceScore - playerScore);
      
      // スコア差が小さいほど選ばれやすくなる重み関数
      // scoreDiffが小さいほど重みが大きくなる
      const weight = 1000 / (scoreDiff + 10); // 0で割るのを防ぐため+10
      
      return {
        playerId,
        weight
      };
    });
    
    // 重みの合計を計算
    const totalWeight = weightedPlayers.reduce((sum, player) => sum + player.weight, 0);
    
    // 重みに基づいてランダムに選択
    let random = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    
    for (const player of weightedPlayers) {
      cumulativeWeight += player.weight;
      if (random <= cumulativeWeight) {
        return player.playerId;
      }
    }
    
    // フォールバック（通常はここに到達しない）
    return eligiblePlayers[0];
  }
  
  // ペナルティラインを生成する
  generatePenaltyRows(lineCount: number, boardWidth: number): number[][] {
    const penaltyRows: number[][] = [];
    
    for (let i = 0; i < lineCount; i++) {
      // ランダムに穴の位置を決定
      const holePosition = Math.floor(Math.random() * boardWidth);
      
      // ペナルティ行を生成（8番はペナルティブロックを表す）
      const row = Array(boardWidth).fill(8);
      row[holePosition] = 0; // 穴を開ける
      
      penaltyRows.push(row);
    }
    
    return penaltyRows;
  }
}
