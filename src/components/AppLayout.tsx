import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface AppLayoutProps {
  sidebar: (layout: {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    isMobile: boolean
  }) => ReactNode
  main: (layout: {
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    isMobile: boolean
  }) => ReactNode
}

export function AppLayout({ sidebar, main }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 700)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 700)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 700)
      setSidebarOpen(window.innerWidth > 700)
    }
    window.addEventListener('resize', handleResize)
    handleResize()
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={'flex h-screen bg-neutral-900 font-sans'}>
      {sidebar({ sidebarOpen, setSidebarOpen, isMobile })}
      <div className="flex-1 bg-dot min-h-screen">
        {main({ sidebarOpen, setSidebarOpen, isMobile })}
      </div>
    </div>
  )
}
