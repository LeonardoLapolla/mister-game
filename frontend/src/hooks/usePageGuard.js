import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// getRedirect: (session) => redirectPath | null
// Returns true once the guard passes; navigates away (with replace) if invalid.
export default function usePageGuard(sessionId, getRedirect) {
  const navigate = useNavigate()
  const [passed, setPassed] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      navigate('/', { replace: true })
      return
    }
    fetch(`/api/game/${sessionId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.session) { navigate('/', { replace: true }); return }
        const to = getRedirect(data.session)
        if (to) { navigate(to, { replace: true }) } else { setPassed(true) }
      })
      .catch(() => navigate('/', { replace: true }))
  }, [sessionId])

  return passed
}
