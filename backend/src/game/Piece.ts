import { Point, TetrominoType, Tetromino } from './GameState';

// テトロミノの形状定義
type ShapeDefinition = {
  [key in TetrominoType]: {
    [rotation: number]: [number, number][];
  };
};

const SHAPES: ShapeDefinition = {
  [TetrominoType.I]: {
    0: [[0, 0], [0, -1], [0, 1], [0, 2]],
    1: [[-1, 0], [0, 0], [1, 0], [2, 0]],
    2: [[0, 0], [0, -1], [0, 1], [0, 2]],
    3: [[-1, 0], [0, 0], [1, 0], [2, 0]]
  },
  [TetrominoType.J]: {
    0: [[0, 0], [-1, 0], [1, 0], [-1, -1]],
    1: [[0, 0], [0, -1], [0, 1], [1, -1]],
    2: [[0, 0], [-1, 0], [1, 0], [1, 1]],
    3: [[0, 0], [0, -1], [0, 1], [-1, 1]]
  },
  [TetrominoType.L]: {
    0: [[0, 0], [-1, 0], [1, 0], [1, -1]],
    1: [[0, 0], [0, -1], [0, 1], [1, 1]],
    2: [[0, 0], [-1, 0], [1, 0], [-1, 1]],
    3: [[0, 0], [0, -1], [0, 1], [-1, -1]]
  },
  [TetrominoType.O]: {
    0: [[0, 0], [1, 0], [0, 1], [1, 1]],
    1: [[0, 0], [1, 0], [0, 1], [1, 1]],
    2: [[0, 0], [1, 0], [0, 1], [1, 1]],
    3: [[0, 0], [1, 0], [0, 1], [1, 1]]
  },
  [TetrominoType.S]: {
    0: [[0, 0], [-1, 0], [0, -1], [1, -1]],
    1: [[0, 0], [0, -1], [1, 0], [1, 1]],
    2: [[0, 0], [1, 0], [0, 1], [-1, 1]],
    3: [[0, 0], [0, 1], [-1, 0], [-1, -1]]
  },
  [TetrominoType.T]: {
    0: [[0, 0], [-1, 0], [1, 0], [0, -1]],
    1: [[0, 0], [0, -1], [0, 1], [1, 0]],
    2: [[0, 0], [-1, 0], [1, 0], [0, 1]],
    3: [[0, 0], [0, -1], [0, 1], [-1, 0]]
  },
  [TetrominoType.Z]: {
    0: [[0, 0], [1, 0], [0, -1], [-1, -1]],
    1: [[0, 0], [0, 1], [1, 0], [1, -1]],
    2: [[0, 0], [-1, 0], [0, 1], [1, 1]],
    3: [[0, 0], [0, -1], [-1, 0], [-1, 1]]
  }
};

// テトロミノの色定義
export const COLORS = {
  [TetrominoType.I]: 1,
  [TetrominoType.J]: 2,
  [TetrominoType.L]: 3,
  [TetrominoType.O]: 4,
  [TetrominoType.S]: 5,
  [TetrominoType.T]: 6,
  [TetrominoType.Z]: 7
};

export class Piece {
  private type: TetrominoType;
  private rotation: number;
  private position: Point;

  constructor(type: TetrominoType, position: Point = { x: 4, y: 0 }, rotation: number = 0) {
    this.type = type;
    this.position = position;
    this.rotation = rotation;
  }

  // テトロミノの形状を取得
  getShape(): Point[] {
    const shape = SHAPES[this.type][this.rotation % 4];
    return shape.map(([x, y]: [number, number]) => ({ 
      x: this.position.x + x, 
      y: this.position.y + y 
    }));
  }

  // テトロミノを移動
  move(dx: number, dy: number): void {
    this.position.x += dx;
    this.position.y += dy;
  }

  // テトロミノを回転
  rotate(clockwise: boolean = true): void {
    this.rotation = (this.rotation + (clockwise ? 1 : 3)) % 4;
  }

  // テトロミノのデータを取得
  getData(): Tetromino {
    return {
      type: this.type,
      position: { ...this.position },
      rotation: this.rotation
    };
  }

  // 色番号を取得
  getColor(): number {
    return COLORS[this.type];
  }
}

// 7バッグ方式のピース生成器
export class PieceGenerator {
  private bag: TetrominoType[] = [];

  constructor() {
    this.refillBag();
  }

  private refillBag(): void {
    this.bag = Object.values(TetrominoType);
    // バッグをシャッフル
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
  }

  // 次のピースを取得
  getNextPiece(): TetrominoType {
    if (this.bag.length === 0) {
      this.refillBag();
    }
    return this.bag.pop()!;
  }
}
