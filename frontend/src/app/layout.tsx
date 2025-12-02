import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'マルチプレイヤーテトリス',
  description: 'マルチプレイヤーテトリスゲームのPoC実装',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-900 text-white min-h-screen">
        <main className="container mx-auto py-4 px-4">
          {children}
        </main>
      </body>
    </html>
  )
}
