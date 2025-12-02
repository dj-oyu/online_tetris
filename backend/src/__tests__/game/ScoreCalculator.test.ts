import { ScoreCalculator } from '../../game/ScoreCalculator';

describe('ScoreCalculator', () => {
  let calculator: ScoreCalculator;

  beforeEach(() => {
    calculator = new ScoreCalculator();
  });

  describe('calculateScore', () => {
    it('should return 0 for 0 lines cleared', () => {
      expect(calculator.calculateScore(0)).toBe(0);
    });

    it('should return 0 for negative lines cleared', () => {
      expect(calculator.calculateScore(-1)).toBe(0);
      expect(calculator.calculateScore(-10)).toBe(0);
    });

    it('should return 100 for 1 line cleared', () => {
      expect(calculator.calculateScore(1)).toBe(100);
    });

    it('should return 300 for 2 lines cleared', () => {
      expect(calculator.calculateScore(2)).toBe(300);
    });

    it('should return 500 for 3 lines cleared', () => {
      expect(calculator.calculateScore(3)).toBe(500);
    });

    it('should return 800 for 4 lines cleared (Tetris)', () => {
      expect(calculator.calculateScore(4)).toBe(800);
    });

    it('should cap at 800 for more than 4 lines cleared', () => {
      expect(calculator.calculateScore(5)).toBe(800);
      expect(calculator.calculateScore(10)).toBe(800);
      expect(calculator.calculateScore(100)).toBe(800);
    });
  });

  describe('calculateComboBonus', () => {
    it('should return 0 for combo of 0', () => {
      expect(calculator.calculateComboBonus(0)).toBe(0);
    });

    it('should return 0 for combo of 1', () => {
      expect(calculator.calculateComboBonus(1)).toBe(0);
    });

    it('should return 50 for combo of 2', () => {
      expect(calculator.calculateComboBonus(2)).toBe(50);
    });

    it('should return 100 for combo of 3', () => {
      expect(calculator.calculateComboBonus(3)).toBe(100);
    });

    it('should return 150 for combo of 4', () => {
      expect(calculator.calculateComboBonus(4)).toBe(150);
    });

    it('should scale linearly with combo count', () => {
      expect(calculator.calculateComboBonus(5)).toBe(200);
      expect(calculator.calculateComboBonus(10)).toBe(450);
      expect(calculator.calculateComboBonus(20)).toBe(950);
    });

    it('should return 0 for negative combo', () => {
      expect(calculator.calculateComboBonus(-1)).toBe(0);
      expect(calculator.calculateComboBonus(-10)).toBe(0);
    });
  });

  describe('Combined scoring scenarios', () => {
    it('should calculate correct total for single line with no combo', () => {
      const score = calculator.calculateScore(1);
      const bonus = calculator.calculateComboBonus(1);
      expect(score + bonus).toBe(100);
    });

    it('should calculate correct total for Tetris with combo', () => {
      const score = calculator.calculateScore(4);
      const bonus = calculator.calculateComboBonus(3);
      expect(score + bonus).toBe(900); // 800 + 100
    });

    it('should calculate correct total for 2 lines with high combo', () => {
      const score = calculator.calculateScore(2);
      const bonus = calculator.calculateComboBonus(10);
      expect(score + bonus).toBe(750); // 300 + 450
    });
  });
});
