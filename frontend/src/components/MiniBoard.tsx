import React from 'react'

interface MiniBoardProps {
  board: number[][]
}

export default function MiniBoard({ board }: MiniBoardProps) {
  // 数値からピースのタイプを取得
  const getPieceTypeFromNumber = (num: number): string => {
    const types = ['', 'I', 'J', 'L', 'O', 'S', 'T', 'Z', '8']
    return types[num] || ''
  }
  
  // ピースのタイプに応じたスタイルを取得
  const getPieceStyle = (type: string) => {
    const pieceTypes: Record<string, string> = {
      'I': 'piece-i',
      'J': 'piece-j',
      'L': 'piece-l',
      'O': 'piece-o',
      'S': 'piece-s',
      'T': 'piece-t',
      'Z': 'piece-z',
      '8': 'piece-penalty' // ペナルティブロック
    }
    
    return pieceTypes[type] || ''
  }
  
  return (
    <div className="mini-board">
      {board.map((row, y) => (
        row.map((cell, x) => {
          const isFilled = cell !== 0
          const pieceType = getPieceTypeFromNumber(cell)
          
          return (
            <div
              key={`${x}-${y}`}
              className={`mini-cell ${isFilled ? 'filled ' + getPieceStyle(pieceType) : ''}`}
            />
          )
        })
      ))}
    </div>
  )
}
