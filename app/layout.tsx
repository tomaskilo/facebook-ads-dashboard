import './globals.css'
import { Providers } from './providers'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'

export const metadata = {
  title: 'Toka Analysis - Advanced Facebook Ads Analytics',
  description: 'Professional Facebook ads performance tracking and analysis dashboard with AI-powered insights for high-performance marketing campaigns.',
  keywords: 'facebook ads, analytics, performance tracking, marketing dashboard, AI insights, social media marketing',
  authors: [{ name: 'Toka Analysis' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-slate-900 text-white min-h-screen">
        <Providers>
          {children}
          <ServiceWorkerRegister />
        </Providers>
      </body>
    </html>
  )
} 