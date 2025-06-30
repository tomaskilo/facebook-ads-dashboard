import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Toka Analysis - Facebook Ads Data Management',
  description: 'Advanced Facebook ads data analysis and management platform for Colonbroom and other products.',
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