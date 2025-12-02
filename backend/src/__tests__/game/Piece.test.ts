import { Piece, PieceGenerator, COLORS } from '../../game/Piece';
import { TetrominoType } from '../../game/GameState';

describe('Piece', () => {
  describe('Constructor', () => {
    it('should create a piece with default position and rotation', () => {
      const piece = new Piece(TetrominoType.I);
      const data = piece.getData();

      expect(data.type).toBe(TetrominoType.I);
      expect(data.position).toEqual({ x: 4, y: 0 });
      expect(data.rotation).toBe(0);
    });

    it('should create a piece with custom position and rotation', () => {
      const piece = new Piece(TetrominoType.T, { x: 5, y: 10 }, 2);
      const data = piece.getData();

      expect(data.type).toBe(TetrominoType.T);
      expect(data.position).toEqual({ x: 5, y: 10 });
      expect(data.rotation).toBe(2);
    });
  });

  describe('getShape', () => {
    it('should return correct shape coordinates for I piece at rotation 0', () => {
      const piece = new Piece(TetrominoType.I, { x: 4, y: 5 }, 0);
      const shape = piece.getShape();

      expect(shape).toEqual([
        { x: 4, y: 5 },
        { x: 4, y: 4 },
        { x: 4, y: 6 },
        { x: 4, y: 7 }
      ]);
    });

    it('should return correct shape coordinates for O piece (all rotations same)', () => {
      const piece = new Piece(TetrominoType.O, { x: 4, y: 0 }, 0);
      const shape = piece.getShape();

      expect(shape).toEqual([
        { x: 4, y: 0 },
        { x: 5, y: 0 },
        { x: 4, y: 1 },
        { x: 5, y: 1 }
      ]);
    });

    it('should return correct shape coordinates for T piece at rotation 0', () => {
      const piece = new Piece(TetrominoType.T, { x: 5, y: 5 }, 0);
      const shape = piece.getShape();

      expect(shape).toEqual([
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 6, y: 5 },
        { x: 5, y: 4 }
      ]);
    });
  });

  describe('move', () => {
    it('should move piece to the right', () => {
      const piece = new Piece(TetrominoType.I, { x: 4, y: 5 });
      piece.move(1, 0);

      const data = piece.getData();
      expect(data.position).toEqual({ x: 5, y: 5 });
    });

    it('should move piece down', () => {
      const piece = new Piece(TetrominoType.I, { x: 4, y: 5 });
      piece.move(0, 1);

      const data = piece.getData();
      expect(data.position).toEqual({ x: 4, y: 6 });
    });

    it('should move piece left and up', () => {
      const piece = new Piece(TetrominoType.I, { x: 4, y: 5 });
      piece.move(-1, -1);

      const data = piece.getData();
      expect(data.position).toEqual({ x: 3, y: 4 });
    });
  });

  describe('rotate', () => {
    it('should rotate piece clockwise', () => {
      const piece = new Piece(TetrominoType.I, { x: 4, y: 5 }, 0);
      piece.rotate(true);

      const data = piece.getData();
      expect(data.rotation).toBe(1);
    });

    it('should rotate piece counter-clockwise', () => {
      const piece = new Piece(TetrominoType.I, { x: 4, y: 5 }, 0);
      piece.rotate(false);

      const data = piece.getData();
      expect(data.rotation).toBe(3);
    });

    it('should wrap rotation from 3 to 0 when rotating clockwise', () => {
      const piece = new Piece(TetrominoType.I, { x: 4, y: 5 }, 3);
      piece.rotate(true);

      const data = piece.getData();
      expect(data.rotation).toBe(0);
    });

    it('should change shape after rotation', () => {
      const piece = new Piece(TetrominoType.I, { x: 4, y: 5 }, 0);
      const shapeBefore = piece.getShape();

      piece.rotate(true);
      const shapeAfter = piece.getShape();

      expect(shapeBefore).not.toEqual(shapeAfter);
    });

    it('should not change shape for O piece after rotation', () => {
      const piece = new Piece(TetrominoType.O, { x: 4, y: 5 }, 0);
      const shapeBefore = piece.getShape();

      piece.rotate(true);
      const shapeAfter = piece.getShape();

      expect(shapeBefore).toEqual(shapeAfter);
    });
  });

  describe('getColor', () => {
    it('should return correct color for each tetromino type', () => {
      const types = [
        TetrominoType.I,
        TetrominoType.J,
        TetrominoType.L,
        TetrominoType.O,
        TetrominoType.S,
        TetrominoType.T,
        TetrominoType.Z
      ];

      types.forEach((type, index) => {
        const piece = new Piece(type);
        expect(piece.getColor()).toBe(index + 1);
      });
    });
  });

  describe('getData', () => {
    it('should return a copy of piece data', () => {
      const piece = new Piece(TetrominoType.T, { x: 5, y: 10 }, 2);
      const data = piece.getData();

      expect(data).toEqual({
        type: TetrominoType.T,
        position: { x: 5, y: 10 },
        rotation: 2
      });
    });

    it('should return a deep copy (modifying returned data should not affect piece)', () => {
      const piece = new Piece(TetrominoType.T, { x: 5, y: 10 }, 2);
      const data = piece.getData();

      data.position.x = 100;
      data.rotation = 3;

      const newData = piece.getData();
      expect(newData.position.x).toBe(5);
      expect(newData.rotation).toBe(2);
    });
  });
});

describe('PieceGenerator', () => {
  describe('7-bag system', () => {
    it('should generate all 7 tetromino types within first 7 pieces', () => {
      const generator = new PieceGenerator();
      const pieces = new Set<TetrominoType>();

      for (let i = 0; i < 7; i++) {
        pieces.add(generator.getNextPiece());
      }

      expect(pieces.size).toBe(7);
      expect(pieces.has(TetrominoType.I)).toBe(true);
      expect(pieces.has(TetrominoType.J)).toBe(true);
      expect(pieces.has(TetrominoType.L)).toBe(true);
      expect(pieces.has(TetrominoType.O)).toBe(true);
      expect(pieces.has(TetrominoType.S)).toBe(true);
      expect(pieces.has(TetrominoType.T)).toBe(true);
      expect(pieces.has(TetrominoType.Z)).toBe(true);
    });

    it('should refill bag after 7 pieces', () => {
      const generator = new PieceGenerator();
      const firstBag = new Set<TetrominoType>();
      const secondBag = new Set<TetrominoType>();

      // First 7 pieces
      for (let i = 0; i < 7; i++) {
        firstBag.add(generator.getNextPiece());
      }

      // Next 7 pieces
      for (let i = 0; i < 7; i++) {
        secondBag.add(generator.getNextPiece());
      }

      expect(firstBag.size).toBe(7);
      expect(secondBag.size).toBe(7);
    });

    it('should generate pieces continuously for many iterations', () => {
      const generator = new PieceGenerator();
      const pieces: TetrominoType[] = [];

      for (let i = 0; i < 100; i++) {
        pieces.push(generator.getNextPiece());
      }

      expect(pieces.length).toBe(100);
      // Check that all pieces are valid tetromino types
      pieces.forEach(piece => {
        expect(Object.values(TetrominoType)).toContain(piece);
      });
    });

    it('should shuffle pieces (order should vary)', () => {
      // This test has a small chance of false positive, but very unlikely
      const generator1 = new PieceGenerator();
      const generator2 = new PieceGenerator();

      const sequence1: TetrominoType[] = [];
      const sequence2: TetrominoType[] = [];

      for (let i = 0; i < 7; i++) {
        sequence1.push(generator1.getNextPiece());
        sequence2.push(generator2.getNextPiece());
      }

      // It's extremely unlikely (1/5040 chance) that two bags have same order
      // If they're different, shuffle is working
      const isDifferent = sequence1.some((piece, i) => piece !== sequence2[i]);

      // Note: This test might occasionally fail due to randomness
      // In production, we'd use a seeded random for deterministic tests
      expect(isDifferent).toBe(true);
    });
  });
});
