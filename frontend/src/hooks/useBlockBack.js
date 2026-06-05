import { useEffect } from 'react'

export default function useBlockBack() {
  useEffect(() => {
    // Aggiunge due stati fittizi invece di uno
    window.history.pushState(null, '', window.location.href)
    window.history.pushState(null, '', window.location.href)

    const handlePopState = () => {
      // Ogni volta che scatta rimette due stati
      window.history.pushState(null, '', window.location.href)
      window.history.pushState(null, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
}