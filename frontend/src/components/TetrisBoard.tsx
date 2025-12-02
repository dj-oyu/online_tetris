'use client'
import React, { useMemo } from 'react'
import { SHAPES, Piece } from '@/lib/tetrominos'

interface TetrisBoardProps {
  board: number[][]
  currentPiece: Piece | null
}

/**
 * TetrisBoard
 * - 親要素 300×600px に合わせて自動調整するグリッド
 */
export default function TetrisBoard({ board, currentPiece }: TetrisBoardProps) {
  // 現在のピース位置リスト
  const currentPositions = useMemo(() => {
    if (!currentPiece) return []
    const { type, position, rotation } = currentPiece
    const shape = SHAPES[type][rotation % 4] || []
    return shape.map(([dx, dy]) => ({
      x: position.x + dx,
      y: position.y + dy,
      type
    }))
  }, [currentPiece])

  // 型から色取得
  const getColor = (type: string) => {
    switch (type) {
      case 'I': return 'bg-cyan-400'
      case 'J': return 'bg-blue-500'
      case 'L': return 'bg-orange-500'
      case 'O': return 'bg-yellow-300'
      case 'S': return 'bg-green-500'
      case 'T': return 'bg-purple-500'
      case 'Z': return 'bg-red-500'
      case '8': return 'bg-gray-600'
      default: return 'bg-black'
    }
  }

  return (
    <div className="w-full h-full grid grid-cols-10 grid-rows-20 gap-px bg-gray-800 p-px">
      {board.flatMap((row, y) =>
        row.map((cell, x) => {
          const pos = currentPositions.find(p => p.x === x && p.y === y)
          const type = pos?.type || (cell !== 0 ? cell.toString() : '')
          const colorClass = getColor(type)
          return (
            <div key={`${x}-${y}`} className={`w-full h-full ${colorClass}`} />
          )
        })
      )}
    </div>
  )
}
