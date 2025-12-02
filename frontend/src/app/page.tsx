'use client'
import { Suspense, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { v4 as uuidv4 } from 'uuid'
import { io, Socket } from 'socket.io-client'
import { RoomInfo } from '@/types/game'

const GameRoom = dynamic(() => import('@/components/GameRoom'), { suspense: true })

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [username, setUsername] = useState<string>('')
  const [roomId, setRoomId] = useState<string | null>(null)
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([])
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // ソケット接続の初期化
  useEffect(() => {
    if (!userId) {
      // ローカルストレージからユーザーIDを取得するか、新しく生成
      const storedUserId = localStorage.getItem('tetris_userId')
      const newUserId = storedUserId || uuidv4()
      setUserId(newUserId)

      if (!storedUserId) {
        localStorage.setItem('tetris_userId', newUserId)
      }

      // ユーザー名もローカルストレージから復元
      const storedUsername = localStorage.getItem('tetris_username')
      if (storedUsername) {
        setUsername(storedUsername)
      }
    }

    if (userId && !socket) {
      // Socket.IO接続を確立
      const newSocket = io(BACKEND_URL, {
        transports: ['websocket', 'polling'],
        path: '/socket.io',
        withCredentials: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      })

      newSocket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
        setError(null)

        // ユーザー認証
        newSocket.emit('auth', { userId, username })

        // ルーム一覧を取得
        newSocket.emit('getRooms')
      })

      newSocket.on('connect_error', (err) => {
        console.error('Connection error:', err)
        setIsConnected(false)
        setError('サーバーに接続できませんでした。再接続を試みています...')
      })

      newSocket.on('reconnect', (attemptNumber) => {
        console.log('Reconnected to server after', attemptNumber, 'attempts')
        setIsConnected(true)
        setError(null)

        // 再接続後にユーザー認証とルーム一覧を再取得
        newSocket.emit('auth', { userId, username })
        newSocket.emit('getRooms')
      })

      newSocket.on('reconnect_attempt', (attemptNumber) => {
        console.log('Reconnection attempt', attemptNumber)
        setError(`サーバーに再接続中... (試行 ${attemptNumber}/5)`)
      })

      newSocket.on('reconnect_failed', () => {
        console.error('Reconnection failed')
        setIsConnected(false)
        setError('サーバーへの再接続に失敗しました。ページを再読み込みしてください。')
      })

      newSocket.on('roomList', (rooms) => {
        setAvailableRooms(rooms)
      })

      newSocket.on('roomListUpdated', () => {
        // ルーム一覧を更新
        newSocket.emit('getRooms')
      })

      newSocket.on('error', (serverError) => {
        console.error('Socket error:', serverError)
        const message = typeof serverError === 'object' ? serverError?.message : serverError
        setError(message || 'サーバーでエラーが発生しました。')
      })

      newSocket.on('disconnect', (reason) => {
        console.log('Disconnected from server, reason:', reason)
        setIsConnected(false)

        if (reason === 'io server disconnect') {
          // サーバーから切断された場合、手動で再接続
          setError('サーバーから切断されました。再接続しています...')
          newSocket.connect()
        } else {
          setError('サーバーとの接続が切断されました。自動再接続を試みています...')
        }
      })

      // ルーム作成時にroomIdをセット
      newSocket.on('roomCreated', (room) => {
        if (room?.id) setRoomId(room.id)
      })

      // 30秒経過で強制スタート通知
      newSocket.on('forceStart', (data) => {
        alert(data?.message || '30秒経過で強制スタートします')
      })

      setSocket(newSocket)

      // クリーンアップ関数
      return () => {
        newSocket.disconnect()
      }
    }
  }, [userId, username])

  // ユーザー名を設定
  const handleSetUsername = (name: string) => {
    setUsername(name)
    localStorage.setItem('tetris_username', name)
  }

  // ルーム作成
  const handleCreateRoom = () => {
    if (socket) {
      socket.emit('createRoom', { name: `${username}'s Room` })
    }
  }

  // ルーム参加
  const handleJoinRoom = (roomId: string) => {
    if (!socket) return

    socket.emit('joinRoom', { roomId }, (result?: { success: boolean; message?: string }) => {
      if (result?.success) {
        setRoomId(roomId)
        setError(null)
        return
      }

      setError(result?.message || 'ルームに参加できませんでした。')
    })
  }

  // ルーム退出
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom')
      setRoomId(null)
    }
  }

  if (!username) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-4">テトリス対戦</h1>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">
              ユーザー名を入力してください
            </label>
            <input
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="ユーザー名"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleSetUsername(e.currentTarget.value.trim())
                }
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  if (roomId) {
    return (
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-xl">ルーム情報を読み込み中...</div></div>}>
        <GameRoom
          socket={socket!}
          userId={userId}
          username={username}
          roomId={roomId}
          onLeave={handleLeaveRoom}
        />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">テトリス対戦</h1>
            <div className="text-sm text-gray-600">
              ようこそ、{username}さん
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={handleCreateRoom}
            disabled={!isConnected}
          >
            新しいルームを作成
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">利用可能なルーム</h2>
          {availableRooms.length === 0 ? (
            <p className="text-gray-600">利用可能なルームがありません</p>
          ) : (
            <div className="grid gap-4">
              {availableRooms.map((room) => (
                <div
                  key={room.id}
                  className="border rounded p-4 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium">{room.name}</div>
                    <div className="text-sm text-gray-600">
                      プレイヤー: {room.playerCount}/2
                    </div>
                  </div>
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={!isConnected || room.playerCount >= 2}
                  >
                    参加
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
