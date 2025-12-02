import { PenaltyManager } from '../../game/PenaltyManager';
import { PlayerState } from '../../game/GameState';

describe('PenaltyManager', () => {
  let manager: PenaltyManager;

  beforeEach(() => {
    manager = new PenaltyManager();
  });

  describe('selectTarget', () => {
    it('should return null when no other active players exist', () => {
      const sourcePlayerId = 'player1';
      const activePlayers = ['player1'];
      const players: Record<string, PlayerState> = {
        player1: { score: 100 } as PlayerState
      };

      const target = manager.selectTarget(sourcePlayerId, activePlayers, players);
      expect(target).toBeNull();
    });

    it('should return null when only source player is active', () => {
      const sourcePlayerId = 'player1';
      const activePlayers = ['player1'];
      const players: Record<string, PlayerState> = {
        player1: { score: 100 } as PlayerState,
        player2: { score: 200 } as PlayerState
      };

      const target = manager.selectTarget(sourcePlayerId, activePlayers, players);
      expect(target).toBeNull();
    });

    it('should return the only other player when only 2 players', () => {
      const sourcePlayerId = 'player1';
      const activePlayers = ['player1', 'player2'];
      const players: Record<string, PlayerState> = {
        player1: { score: 100 } as PlayerState,
        player2: { score: 200 } as PlayerState
      };

      const target = manager.selectTarget(sourcePlayerId, activePlayers, players);
      expect(target).toBe('player2');
    });

    it('should never select the source player', () => {
      const sourcePlayerId = 'player1';
      const activePlayers = ['player1', 'player2', 'player3'];
      const players: Record<string, PlayerState> = {
        player1: { score: 100 } as PlayerState,
        player2: { score: 200 } as PlayerState,
        player3: { score: 300 } as PlayerState
      };

      // Run multiple times to ensure randomness doesn't select source
      for (let i = 0; i < 50; i++) {
        const target = manager.selectTarget(sourcePlayerId, activePlayers, players);
        expect(target).not.toBe(sourcePlayerId);
        expect(['player2', 'player3']).toContain(target);
      }
    });

    it('should select from eligible players only', () => {
      const sourcePlayerId = 'player1';
      const activePlayers = ['player1', 'player2', 'player3'];
      const players: Record<string, PlayerState> = {
        player1: { score: 100 } as PlayerState,
        player2: { score: 100 } as PlayerState,
        player3: { score: 100 } as PlayerState,
        player4: { score: 100 } as PlayerState // Not active
      };

      for (let i = 0; i < 50; i++) {
        const target = manager.selectTarget(sourcePlayerId, activePlayers, players);
        expect(['player2', 'player3']).toContain(target);
        expect(target).not.toBe('player4');
      }
    });

    it('should weight selection towards players with similar scores', () => {
      const sourcePlayerId = 'player1';
      const activePlayers = ['player1', 'player2', 'player3'];
      const players: Record<string, PlayerState> = {
        player1: { score: 100 } as PlayerState,
        player2: { score: 105 } as PlayerState, // Very close score
        player3: { score: 1000 } as PlayerState  // Very different score
      };

      // Run many times and count selections
      const counts = { player2: 0, player3: 0 };
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const target = manager.selectTarget(sourcePlayerId, activePlayers, players);
        if (target === 'player2') counts.player2++;
        if (target === 'player3') counts.player3++;
      }

      // player2 (similar score) should be selected much more often than player3
      expect(counts.player2).toBeGreaterThan(counts.player3);
      // Expect at least 80% of selections to be player2
      expect(counts.player2 / iterations).toBeGreaterThan(0.8);
    });

    it('should handle equal scores correctly', () => {
      const sourcePlayerId = 'player1';
      const activePlayers = ['player1', 'player2', 'player3', 'player4'];
      const players: Record<string, PlayerState> = {
        player1: { score: 100 } as PlayerState,
        player2: { score: 100 } as PlayerState,
        player3: { score: 100 } as PlayerState,
        player4: { score: 100 } as PlayerState
      };

      // With equal scores, all should have equal probability
      const counts = { player2: 0, player3: 0, player4: 0 };
      const iterations = 3000;

      for (let i = 0; i < iterations; i++) {
        const target = manager.selectTarget(sourcePlayerId, activePlayers, players);
        if (target === 'player2') counts.player2++;
        if (target === 'player3') counts.player3++;
        if (target === 'player4') counts.player4++;
      }

      // Each should be selected roughly 1/3 of the time (within 10% margin)
      const expected = iterations / 3;
      const margin = expected * 0.1;

      expect(counts.player2).toBeGreaterThan(expected - margin);
      expect(counts.player2).toBeLessThan(expected + margin);
      expect(counts.player3).toBeGreaterThan(expected - margin);
      expect(counts.player3).toBeLessThan(expected + margin);
      expect(counts.player4).toBeGreaterThan(expected - margin);
      expect(counts.player4).toBeLessThan(expected + margin);
    });
  });

  describe('generatePenaltyRows', () => {
    it('should generate correct number of penalty rows', () => {
      const rows = manager.generatePenaltyRows(3, 10);
      expect(rows.length).toBe(3);
    });

    it('should generate rows with correct width', () => {
      const rows = manager.generatePenaltyRows(5, 10);
      rows.forEach(row => {
        expect(row.length).toBe(10);
      });
    });

    it('should generate rows with correct width for different board sizes', () => {
      const rows1 = manager.generatePenaltyRows(2, 8);
      rows1.forEach(row => expect(row.length).toBe(8));

      const rows2 = manager.generatePenaltyRows(2, 12);
      rows2.forEach(row => expect(row.length).toBe(12));
    });

    it('should have exactly one hole (0) in each row', () => {
      const rows = manager.generatePenaltyRows(10, 10);
      rows.forEach(row => {
        const holes = row.filter(cell => cell === 0);
        expect(holes.length).toBe(1);
      });
    });

    it('should fill non-hole cells with penalty blocks (8)', () => {
      const rows = manager.generatePenaltyRows(5, 10);
      rows.forEach(row => {
        const penaltyBlocks = row.filter(cell => cell === 8);
        expect(penaltyBlocks.length).toBe(9); // 10 - 1 hole
      });
    });

    it('should place holes at valid positions', () => {
      const boardWidth = 10;
      const rows = manager.generatePenaltyRows(20, boardWidth);

      rows.forEach(row => {
        const holeIndex = row.indexOf(0);
        expect(holeIndex).toBeGreaterThanOrEqual(0);
        expect(holeIndex).toBeLessThan(boardWidth);
      });
    });

    it('should randomize hole positions', () => {
      const rows = manager.generatePenaltyRows(50, 10);
      const holePositions = rows.map(row => row.indexOf(0));
      const uniquePositions = new Set(holePositions);

      // With 50 rows and 10 possible positions, we should see variety
      // (statistically very unlikely to have only 1-2 unique positions)
      expect(uniquePositions.size).toBeGreaterThan(5);
    });

    it('should handle edge case of 0 lines', () => {
      const rows = manager.generatePenaltyRows(0, 10);
      expect(rows.length).toBe(0);
    });

    it('should handle edge case of single column board', () => {
      const rows = manager.generatePenaltyRows(3, 1);
      expect(rows.length).toBe(3);
      rows.forEach(row => {
        expect(row.length).toBe(1);
        expect(row[0]).toBe(0); // Only position must be hole
      });
    });

    it('should generate independent rows (each with own hole position)', () => {
      const rows = manager.generatePenaltyRows(10, 10);

      // Check that not all rows have hole in same position
      const firstHolePos = rows[0].indexOf(0);
      const allSame = rows.every(row => row.indexOf(0) === firstHolePos);

      // With 10 rows, statistically very unlikely all holes are in same position
      expect(allSame).toBe(false);
    });
  });

  describe('Integration scenarios', () => {
    it('should work correctly in 8-player scenario', () => {
      const sourcePlayerId = 'player1';
      const activePlayers = ['player1', 'player2', 'player3', 'player4', 'player5', 'player6', 'player7', 'player8'];
      const players: Record<string, PlayerState> = {};

      // Create players with varying scores
      activePlayers.forEach((id, index) => {
        players[id] = { score: index * 100 } as PlayerState;
      });

      const target = manager.selectTarget(sourcePlayerId, activePlayers, players);
      expect(target).not.toBeNull();
      expect(target).not.toBe(sourcePlayerId);
      expect(activePlayers).toContain(target as string);
    });

    it('should generate penalty rows that could be applied to a board', () => {
      const boardWidth = 10;
      const penaltyRows = manager.generatePenaltyRows(2, boardWidth);

      // Simulate adding to bottom of a board
      const board: number[][] = Array(20).fill(null).map(() => Array(10).fill(0));

      // Should be able to append penalty rows without issue
      penaltyRows.forEach(row => {
        expect(row.length).toBe(boardWidth);
        board.push(row);
      });

      expect(board.length).toBe(22);
    });
  });
});
