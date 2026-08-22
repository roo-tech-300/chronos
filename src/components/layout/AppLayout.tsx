import type { ReactNode } from 'react'
import AppNavbar from './AppNavbar'

interface AppLayoutProps {
  children: ReactNode
  brandName?: string
  brandLogo?: string
  className?: string
}

export default function AppLayout({
  children,
  brandName,
  brandLogo,
  className = '',
}: AppLayoutProps) {
  return (
    <div className={`min-h-screen bg-[#f3f4f6] text-[#191c1d] ${className}`}>
      <AppNavbar brandName={brandName} brandLogo={brandLogo} />
      <div className="pt-16">
        {children}
      </div>
    </div>
  )
}
