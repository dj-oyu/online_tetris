export class ScoreCalculator {
    // 基本スコア（ライン消去数に応じたスコア）
    private baseScores = {
      1: 100,  // 1ライン消去: 100点
      2: 300,  // 2ライン消去: 300点
      3: 500,  // 3ライン消去: 500点
      4: 800   // 4ライン消去: 800点
    };
    
    // スコア計算処理
    calculateScore(linesCleared: number): number {
      if (linesCleared <= 0) return 0;
      if (linesCleared > 4) linesCleared = 4; // 最大4ラインまで
      
      return this.baseScores[linesCleared as keyof typeof this.baseScores];
    }
    
    // コンボボーナスの計算（連続でライン消去を行った場合のボーナス）
    calculateComboBonus(combo: number): number {
      if (combo <= 1) return 0;
      
      // コンボが増えるほどボーナスが増加
      return 50 * (combo - 1);
    }
  }
