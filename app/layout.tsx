import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'AdForge Pro - Facebook Ads Analytics Dashboard',
  description: 'AI-Powered Facebook Ads Analytics and Performance Tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-slate-900 text-white min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
} 