'use client'
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import TetrisGame from './TetrisGame'
import { Socket } from 'socket.io-client'
import MiniBoard from './MiniBoard'
import { GameState, RoomInfo, PlayerInfo, ChatMessage } from '@/types/game'

interface GameRoomProps {
  socket: Socket | null
  roomId: string
  userId: string
  username: string
  onLeave: () => void
}

export default function GameRoom({ socket, roomId, userId, username, onLeave }: GameRoomProps) {
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isReady, setIsReady] = useState<boolean>(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [messageInput, setMessageInput] = useState<string>('')
  const [isSpectator, setIsSpectator] = useState<boolean>(false)
  
  // 初期マウント時にルーム・ゲーム状態を同期
  useEffect(() => {
    if (!socket || !roomId) return
    socket.emit('syncRoomState')
  }, [socket, roomId])

  // ルーム状態・ゲーム状態の更新を監視
  useEffect(() => {
    if (!socket) return

    const handleRoomUpdated = (info: RoomInfo) => {
      setRoomInfo(info)
      const playerIds = info.players.map((p: PlayerInfo) => p.id)
      setIsSpectator(!playerIds.includes(userId))
    }

    const handleGameState = (state: GameState) => {
      setGameState(state)
      if (state.spectators.includes(userId)) {
        setIsSpectator(true)
      } else if (state.players[userId]) {
        // gameState.playersに自分のIDが含まれていればプレイヤー扱い
        setIsSpectator(false)
      }
    }

    socket.on('roomUpdated', handleRoomUpdated)
    socket.on('gameState', handleGameState)

    return () => {
      socket.off('roomUpdated', handleRoomUpdated)
      socket.off('gameState', handleGameState)
    }
  }, [socket, userId])

  // チャットメッセージを追加
  const addChatMessage = useCallback((message: Partial<ChatMessage>) => {
    setChatMessages((prev) => [...prev, {
      ...message,
      id: Date.now()
    } as ChatMessage])
  }, [])

  // チャット・通知イベントを監視
  useEffect(() => {
    if (!socket) return

    const handlePlayerJoined = (data: { username: string; isPlayer: boolean }) => {
      addChatMessage({
        system: true,
        message: `${data.username}が${data.isPlayer ? '参加' : '観戦'}しました`
      })
    }

    const handlePlayerLeft = (data: { username: string }) => {
      addChatMessage({
        system: true,
        message: `${data.username}が退出しました`
      })
    }

    const handleChatMessage = (message: ChatMessage) => {
      addChatMessage(message)
    }

    const handleGameOver = (data: { playerName: string }) => {
      addChatMessage({
        system: true,
        message: `ゲーム終了! ${data.playerName}の勝利です!`
      })
    }

    socket.on('playerJoined', handlePlayerJoined)
    socket.on('playerLeft', handlePlayerLeft)
    socket.on('chatMessage', handleChatMessage)
    socket.on('gameOver', handleGameOver)

    return () => {
      socket.off('playerJoined', handlePlayerJoined)
      socket.off('playerLeft', handlePlayerLeft)
      socket.off('chatMessage', handleChatMessage)
      socket.off('gameOver', handleGameOver)
    }
  }, [socket, addChatMessage])

  // メッセージを送信
  const sendMessage = useCallback(() => {
    if (!socket || !messageInput.trim()) return

    socket.emit('chatMessage', { message: messageInput })
    setMessageInput('')
  }, [socket, messageInput])

  // 準備状態を切り替え
  const toggleReady = useCallback(() => {
    if (!socket) return

    const newState = !isReady
    socket.emit('playerReady', { ready: newState })
    setIsReady(newState)
  }, [socket, isReady])

  // ルームから退出
  const leaveRoom = useCallback(() => {
    if (!socket) return

    socket.emit('leaveRoom')
    onLeave()
  }, [socket, onLeave])

  // ゲームアクションを送信
  const sendGameAction = useCallback((action: string, data?: any) => {
    if (!socket || isSpectator) return

    socket.emit('gameAction', { action, data })
  }, [socket, isSpectator])

  // 自分のプレイヤー情報を取得
  const myPlayer = useMemo(() => gameState?.players?.[userId], [gameState, userId])

  // 他のプレイヤー情報を取得
  const otherPlayers = useMemo(() => {
    if (!gameState) return []
    return Object.entries(gameState.players)
      .filter(([id]) => id !== userId)
      .map(([id, data]) => ({
        id,
        ...data
      }))
  }, [gameState, userId])

  if (!roomInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">ルーム情報を読み込み中...</div>
      </div>
    )
  }

  const isPlaying = roomInfo.state === 'playing'
  const isStarting = roomInfo.state === 'starting'
  const isWaiting = roomInfo.state === 'waiting'
  const isFinished = roomInfo.state === 'finished'
  
  return (
    <div className="flex flex-col h-screen max-h-screen py-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{roomInfo.name}</h1>
        <div className="flex items-center space-x-4">
          {isWaiting && !isSpectator && (
            <button
              className={`px-4 py-2 rounded font-bold ${isReady ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
              onClick={toggleReady}
            >
              {isReady ? '準備完了' : '準備する'}
            </button>
          )}
          <button
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
            onClick={leaveRoom}
          >
            退出
          </button>
        </div>
      </div>
      
      <div className="flex flex-1 space-x-4 overflow-hidden">
        {/* メインゲーム画面 */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* TetrisGameコンポーネントの表示領域を確保 */}
          <div className="w-[300px] h-[600px] flex-shrink-0"> {/* 固定サイズを指定 */}
          <TetrisGame
            gameState={gameState}
            playerId={userId}
            isSpectator={isSpectator}
            onAction={sendGameAction}
          />
          </div>
          
          {isStarting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
              <div className="text-6xl font-bold animate-pulse">ゲーム開始まもなく...</div>
            </div>
          )}
          
          {/* ゲーム情報 */}
          <div className="bg-gray-800 p-4 rounded-lg mt-4">
            <div className="flex justify-between">
              <div>
                <div className="text-xl font-bold mb-1">
                  {username} {isSpectator && '(観戦中)'}
                </div>
                {!isSpectator && myPlayer && (
                  <div>
                    <div>スコア: {myPlayer.score}</div>
                    <div>消去ライン: {myPlayer.linesCleared}</div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div>プレイヤー: {roomInfo.playerCount} / 8</div>
                <div>観戦者: {roomInfo.spectatorCount}</div>
                <div className="font-bold">
                  {isWaiting && '待機中'}
                  {isStarting && '開始中...'}
                  {isPlaying && 'ゲーム中'}
                  {isFinished && '終了'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* サイドバー */}
        <div className="w-80 flex flex-col bg-gray-800 rounded-lg overflow-hidden">
          {/* 他プレイヤーのミニボード */}
          <div className="p-4 bg-gray-900">
            <h2 className="text-xl font-bold mb-4">他のプレイヤー</h2>
            <div className="grid grid-cols-2 gap-2">
              {otherPlayers.map((player) => (
                <div key={player.id} className="bg-gray-800 p-2 rounded">
                  <div className="text-sm font-bold mb-1 truncate">
                    {player.username}
                    {player.isGameOver && ' (GameOver)'}
                  </div>
                  <MiniBoard board={player.board} />
                  <div className="flex justify-between text-xs mt-1">
                    <div>スコア: {player.score}</div>
                    <div>ライン: {player.linesCleared}</div>
                  </div>
                </div>
              ))}
              {otherPlayers.length === 0 && (
                <div className="col-span-2 text-center text-gray-500 py-4">
                  他のプレイヤーがいません
                </div>
              )}
            </div>
          </div>
          
          {/* チャット */}
          <div className="flex-1 flex flex-col bg-gray-800 rounded-b-lg overflow-hidden">
            <h2 className="text-xl font-bold p-4">チャット</h2>
            <div className="flex-1 overflow-y-auto p-4 bg-gray-700">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`mb-2 ${msg.system ? 'text-yellow-400' : ''}`}>
                  {!msg.system && <span className="font-bold">{msg.username || 'システム'}: </span>}
                  {msg.message}
                </div>
              ))}
              {chatMessages.length === 0 && (
                <div className="text-gray-500 text-center">
                  メッセージはまだありません
                </div>
              )}
            </div>
            <div className="p-4 bg-gray-800 border-t border-gray-700">
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 bg-gray-700 rounded-l p-2 outline-none"
                  placeholder="メッセージを入力..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                />
                <button
                  className="bg-blue-600 hover:bg-blue-700 rounded-r px-4"
                  onClick={sendMessage}
                >
                  送信
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
