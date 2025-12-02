'use client'
import { useEffect, useRef, useMemo } from 'react'
import TetrisBoard from './TetrisBoard'
import useKeyboardControls from '@/hooks/useKeyboardControls'
import { GameState } from '@/types/game'

interface TetrisGameProps {
  gameState: GameState | null
  playerId: string
  isSpectator: boolean
  onAction: (action: string, data?: any) => void
}

export default function TetrisGame({ gameState, playerId, isSpectator, onAction }: TetrisGameProps) {
  const controlsEnabledRef = useRef(!isSpectator)
  
  // ゲーム状態が変わったときにコントロールの有効/無効を更新
  useEffect(() => {
    controlsEnabledRef.current = !isSpectator && 
      gameState?.isActive && 
      gameState?.activePlayers?.includes(playerId)
  }, [gameState, playerId, isSpectator])
  
  // キーボード操作の設定
  useKeyboardControls({
    onLeft: () => {
      if (controlsEnabledRef.current) {
        onAction('moveLeft')
      }
    },
    onRight: () => {
      if (controlsEnabledRef.current) {
        onAction('moveRight')
      }
    },
    onDown: () => {
      if (controlsEnabledRef.current) {
        onAction('moveDown')
      }
    },
    onRotateClockwise: () => {
      if (controlsEnabledRef.current) {
        onAction('rotate', { clockwise: true })
      }
    },
    onRotateCounterClockwise: () => {
      if (controlsEnabledRef.current) {
        onAction('rotate', { clockwise: false })
      }
    },
    onHardDrop: () => {
      if (controlsEnabledRef.current) {
        onAction('hardDrop')
      }
    }
  })
  
  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl">ゲームを読み込み中...</div>
      </div>
    )
  }

  // プレイヤーの状態を取得
  const playerState = gameState.players?.[playerId]
  const isGameOver = playerState?.isGameOver || false
  const isWinner = gameState.winner === playerId

  // ゲームの表示内容を決定
  let boardToShow
  let currentPiece = null
  let nextPiece = null

  if (playerState) {
    // 自分のプレイヤーデータがある場合
    boardToShow = playerState.board
    currentPiece = playerState.currentPiece
    nextPiece = playerState.nextPiece
  } else if (gameState.activePlayers?.length > 0) {
    // 観戦モードの場合は一番最初のアクティブプレイヤーを表示
    const firstPlayerId = gameState.activePlayers[0]
    const firstPlayerState = gameState.players?.[firstPlayerId]
    boardToShow = firstPlayerState?.board
    // 観戦モードでは相手のピースは表示しない
  } else if (gameState.spectators?.length > 0) {
    // アクティブプレイヤーがいない場合は最初の観戦者を表示
    const firstSpectatorId = gameState.spectators[0]
    const spectatorState = gameState.players?.[firstSpectatorId]
    boardToShow = spectatorState?.board
  }

  // ボードが存在しない場合は空のボードを表示
  if (!boardToShow) {
    boardToShow = Array(20).fill(0).map(() => Array(10).fill(0))
  }

  
  return (
    <div className="relative flex items-center justify-center h-full w-full">
      <div className="flex items-center">
        {/* メインのテトリスボード */}
        <div className="relative w-full h-full">
          <TetrisBoard
            board={boardToShow}
            currentPiece={!isSpectator ? currentPiece : null}
          />
          
          {/* ゲームオーバーのオーバーレイ */}
          {isGameOver && (
            <div className="game-over-overlay">
              <div className="text-4xl font-bold mb-4 text-red-500">ゲームオーバー</div>
              <div className="text-xl mb-2">観戦モードに移行しました</div>
            </div>
          )}
          
          {/* 勝者のオーバーレイ */}
          {isWinner && (
            <div className="game-over-overlay">
              <div className="text-4xl font-bold mb-4 text-yellow-400">勝利!</div>
              <div className="text-xl">おめでとうございます！</div>
            </div>
          )}
        </div>
        
        {/* 次のピース表示など */}
        <div className="ml-6 w-24">
          <div className="bg-gray-800 p-3 rounded-lg mb-4">
            <div className="text-center text-sm mb-2">次のピース</div>
            <div className="bg-gray-900 p-2 rounded">
              {nextPiece && renderNextPiece(nextPiece)}
              {!nextPiece && <div className="h-16"></div>}
            </div>
          </div>
          
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-sm mb-1">スコア</div>
            <div className="text-xl font-bold">{playerState?.score || 0}</div>
            
            <div className="text-sm mt-3 mb-1">ライン</div>
            <div className="text-xl font-bold">{playerState?.linesCleared || 0}</div>
            
            {!isSpectator && (
              <>
                <div className="text-sm mt-3 mb-1">攻撃数</div>
                <div className="text-xl font-bold">{playerState?.penaltiesGiven || 0}</div>
                
                <div className="text-sm mt-3 mb-1">被攻撃数</div>
                <div className="text-xl font-bold">{playerState?.penaltiesReceived || 0}</div>
              </>
            )}
          </div>
          
          {isSpectator && (
            <div className="bg-yellow-800 mt-4 p-3 rounded-lg text-center">
              <div className="text-sm">観戦モード</div>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-400">
            <div>← →: 移動</div>
            <div>↓: 下に移動</div>
            <div>↑: 回転</div>
            <div>スペース: ハードドロップ</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 次のピースをレンダリング
function renderNextPiece(pieceType: string) {
  const pieceShapes: Record<string, number[][]> = {
    'I': [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    'J': [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
    'L': [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
    'O': [[4, 4], [4, 4]],
    'S': [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
    'T': [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
    'Z': [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
  }
  
  const shape = pieceShapes[pieceType] || pieceShapes['I']
  const size = shape.length
  const cellSize = size === 4 ? 'w-4 h-4' : 'w-5 h-5'
  
  return (
    <div className="flex justify-center">
      <div 
        className="grid gap-px"
        style={{
          gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`
        }}
      >
        {shape.flat().map((cell, i) => (
          <div
            key={i}
            className={`${cellSize} ${cell ? `piece-${pieceType.toLowerCase()}` : 'bg-transparent'}`}
          />
        ))}
      </div>
    </div>
  )
}
