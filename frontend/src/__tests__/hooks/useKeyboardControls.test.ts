import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useKeyboardControls from '@/hooks/useKeyboardControls';

describe('useKeyboardControls', () => {
  let callbacks: {
    onLeft: ReturnType<typeof vi.fn>;
    onRight: ReturnType<typeof vi.fn>;
    onDown: ReturnType<typeof vi.fn>;
    onRotateClockwise: ReturnType<typeof vi.fn>;
    onRotateCounterClockwise: ReturnType<typeof vi.fn>;
    onHardDrop: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    callbacks = {
      onLeft: vi.fn(),
      onRight: vi.fn(),
      onDown: vi.fn(),
      onRotateClockwise: vi.fn(),
      onRotateCounterClockwise: vi.fn(),
      onHardDrop: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const fireKeyDown = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code }));
  };

  const fireKeyUp = (code: string) => {
    window.dispatchEvent(new KeyboardEvent('keyup', { code }));
  };

  describe('Single key press', () => {
    it('should call onLeft when ArrowLeft is pressed', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowLeft');

      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);
    });

    it('should call onRight when ArrowRight is pressed', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowRight');

      expect(callbacks.onRight).toHaveBeenCalledTimes(1);
    });

    it('should call onDown when ArrowDown is pressed', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowDown');

      expect(callbacks.onDown).toHaveBeenCalledTimes(1);
    });

    it('should call onRotateClockwise when ArrowUp is pressed', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowUp');

      expect(callbacks.onRotateClockwise).toHaveBeenCalledTimes(1);
    });

    it('should call onRotateCounterClockwise when KeyZ is pressed', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('KeyZ');

      expect(callbacks.onRotateCounterClockwise).toHaveBeenCalledTimes(1);
    });

    it('should call onHardDrop when Space is pressed', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('Space');

      expect(callbacks.onHardDrop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Key release', () => {
    it('should stop repeating when key is released', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowLeft');
      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);

      // Advance to start repeating
      vi.advanceTimersByTime(200); // Initial delay
      vi.advanceTimersByTime(100); // First repeat
      expect(callbacks.onLeft).toHaveBeenCalledTimes(2);

      // Release key
      fireKeyUp('ArrowLeft');

      // Advance time - should not call anymore
      vi.advanceTimersByTime(100);
      vi.advanceTimersByTime(100);
      expect(callbacks.onLeft).toHaveBeenCalledTimes(2);
    });
  });

  describe('Key repeat behavior', () => {
    it('should repeat ArrowLeft after initial delay', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowLeft');
      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);

      // Before initial delay
      vi.advanceTimersByTime(100);
      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);

      // After initial delay (200ms)
      vi.advanceTimersByTime(100);
      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);

      // First repeat (after 100ms interval)
      vi.advanceTimersByTime(100);
      expect(callbacks.onLeft).toHaveBeenCalledTimes(2);

      // Second repeat
      vi.advanceTimersByTime(100);
      expect(callbacks.onLeft).toHaveBeenCalledTimes(3);

      // Third repeat
      vi.advanceTimersByTime(100);
      expect(callbacks.onLeft).toHaveBeenCalledTimes(4);
    });

    it('should repeat ArrowRight after initial delay', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowRight');
      expect(callbacks.onRight).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(200); // Initial delay
      vi.advanceTimersByTime(100); // First repeat
      expect(callbacks.onRight).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(100); // Second repeat
      expect(callbacks.onRight).toHaveBeenCalledTimes(3);
    });

    it('should repeat ArrowDown after initial delay', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowDown');
      expect(callbacks.onDown).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(200); // Initial delay
      vi.advanceTimersByTime(100); // First repeat
      expect(callbacks.onDown).toHaveBeenCalledTimes(2);
    });

    it('should NOT repeat rotation keys', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowUp');
      expect(callbacks.onRotateClockwise).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500); // Wait long time
      expect(callbacks.onRotateClockwise).toHaveBeenCalledTimes(1); // Still only 1
    });

    it('should NOT repeat KeyZ', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('KeyZ');
      expect(callbacks.onRotateCounterClockwise).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500);
      expect(callbacks.onRotateCounterClockwise).toHaveBeenCalledTimes(1);
    });

    it('should NOT repeat Space', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('Space');
      expect(callbacks.onHardDrop).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(500);
      expect(callbacks.onHardDrop).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple keys simultaneously', () => {
    it('should handle multiple keys pressed at once', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowLeft');
      fireKeyDown('ArrowDown');

      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);
      expect(callbacks.onDown).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(200);
      vi.advanceTimersByTime(100);

      expect(callbacks.onLeft).toHaveBeenCalledTimes(2);
      expect(callbacks.onDown).toHaveBeenCalledTimes(2);
    });

    it('should handle keys pressed and released independently', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowLeft');
      fireKeyDown('ArrowRight');

      vi.advanceTimersByTime(200);
      vi.advanceTimersByTime(100);

      expect(callbacks.onLeft).toHaveBeenCalledTimes(2);
      expect(callbacks.onRight).toHaveBeenCalledTimes(2);

      // Release left
      fireKeyUp('ArrowLeft');

      vi.advanceTimersByTime(100);

      expect(callbacks.onLeft).toHaveBeenCalledTimes(2); // Stopped
      expect(callbacks.onRight).toHaveBeenCalledTimes(3); // Still going
    });
  });

  describe('Prevent duplicate key down', () => {
    it('should ignore repeated keydown events while key is held', () => {
      renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowLeft');
      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);

      // Simulate OS key repeat
      fireKeyDown('ArrowLeft');
      fireKeyDown('ArrowLeft');
      fireKeyDown('ArrowLeft');

      expect(callbacks.onLeft).toHaveBeenCalledTimes(1); // Still 1
    });
  });

  describe('Optional callbacks', () => {
    it('should not crash when callbacks are undefined', () => {
      renderHook(() => useKeyboardControls({}));

      expect(() => {
        fireKeyDown('ArrowLeft');
        fireKeyDown('ArrowRight');
        fireKeyDown('ArrowDown');
        fireKeyDown('ArrowUp');
        fireKeyDown('KeyZ');
        fireKeyDown('Space');
      }).not.toThrow();
    });

    it('should only call provided callbacks', () => {
      const partialCallbacks = {
        onLeft: vi.fn(),
        onRotateClockwise: vi.fn(),
      };

      renderHook(() => useKeyboardControls(partialCallbacks));

      fireKeyDown('ArrowLeft');
      fireKeyDown('ArrowRight');
      fireKeyDown('ArrowUp');

      expect(partialCallbacks.onLeft).toHaveBeenCalledTimes(1);
      expect(partialCallbacks.onRotateClockwise).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowLeft');
      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);

      unmount();

      fireKeyDown('ArrowLeft');
      expect(callbacks.onLeft).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should clear all timers on unmount', () => {
      const { unmount } = renderHook(() => useKeyboardControls(callbacks));

      fireKeyDown('ArrowLeft');
      vi.advanceTimersByTime(200);

      unmount();

      // Advance time after unmount - should not call
      vi.advanceTimersByTime(100);
      vi.advanceTimersByTime(100);

      expect(callbacks.onLeft).toHaveBeenCalledTimes(1);
    });
  });

  describe('Callback updates', () => {
    it('should use updated callbacks', () => {
      const initialCallback = vi.fn();
      const updatedCallback = vi.fn();

      const { rerender } = renderHook(
        ({ onLeft }) => useKeyboardControls({ onLeft }),
        { initialProps: { onLeft: initialCallback } }
      );

      fireKeyDown('ArrowLeft');
      expect(initialCallback).toHaveBeenCalledTimes(1);
      expect(updatedCallback).toHaveBeenCalledTimes(0);

      // Update callback
      rerender({ onLeft: updatedCallback });

      fireKeyUp('ArrowLeft');
      fireKeyDown('ArrowLeft');

      expect(initialCallback).toHaveBeenCalledTimes(1);
      expect(updatedCallback).toHaveBeenCalledTimes(1);
    });
  });
});
