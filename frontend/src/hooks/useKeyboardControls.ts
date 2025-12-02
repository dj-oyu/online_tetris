import { useEffect, useRef } from 'react';

interface KeyboardControlsProps {
  onLeft?: () => void;
  onRight?: () => void;
  onDown?: () => void;
  onRotateClockwise?: () => void;
  onRotateCounterClockwise?: () => void;
  onHardDrop?: () => void;
}

export default function useKeyboardControls({
  onLeft,
  onRight,
  onDown,
  onRotateClockwise,
  onRotateCounterClockwise,
  onHardDrop
}: KeyboardControlsProps) {
  // 連続キー入力のための状態管理
  const keyState = useRef<Record<string, boolean>>({});
  const keyInterval = useRef<Record<string, NodeJS.Timeout | null>>({});
  const intervalDelay = 100; // キー押しっぱなしの際の動作間隔（ミリ秒）
  const initialDelay = 200; // 最初の連続入力までの遅延（ミリ秒）
  
  // キーが押された時の処理
  const handleKeyDown = (event: KeyboardEvent) => {
    if (keyState.current[event.code]) return; // 既に押されている場合は無視
    
    keyState.current[event.code] = true;
    
    // キーに応じたアクション
    switch (event.code) {
      case 'ArrowLeft':
        onLeft?.();
        // 連続入力のためのタイマー設定
        keyInterval.current[event.code] = setTimeout(() => {
          keyInterval.current[event.code] = setInterval(() => {
            onLeft?.();
          }, intervalDelay);
        }, initialDelay) as any;
        break;
        
      case 'ArrowRight':
        onRight?.();
        keyInterval.current[event.code] = setTimeout(() => {
          keyInterval.current[event.code] = setInterval(() => {
            onRight?.();
          }, intervalDelay);
        }, initialDelay) as any;
        break;
        
      case 'ArrowDown':
        onDown?.();
        keyInterval.current[event.code] = setTimeout(() => {
          keyInterval.current[event.code] = setInterval(() => {
            onDown?.();
          }, intervalDelay);
        }, initialDelay) as any;
        break;
        
      case 'ArrowUp':
        onRotateClockwise?.();
        break;
        
      case 'KeyZ':
        onRotateCounterClockwise?.();
        break;
        
      case 'Space':
        onHardDrop?.();
        event.preventDefault(); // スクロールを防止
        break;
    }
  };
  
  // キーが離された時の処理
  const handleKeyUp = (event: KeyboardEvent) => {
    keyState.current[event.code] = false;
    
    // タイマーをクリア
    if (keyInterval.current[event.code]) {
      clearInterval(keyInterval.current[event.code] as NodeJS.Timeout);
      keyInterval.current[event.code] = null;
    }
  };
  
  // イベントリスナーの設定
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // クリーンアップ関数
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      
      // 残っているタイマーをクリア
      Object.values(keyInterval.current).forEach(interval => {
        if (interval) {
          clearInterval(interval);
        }
      });
    };
  }, [onLeft, onRight, onDown, onRotateClockwise, onRotateCounterClockwise, onHardDrop]);
}
