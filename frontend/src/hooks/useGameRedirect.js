import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function useGameRedirect(sessionId, currentPage) {
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    if (!sessionId) { setChecked(true); return }
    checkAndRedirect()
  }, [sessionId])

  const checkAndRedirect = async () => {
    try {
      const res = await fetch(`/api/game/${sessionId}`)
      if (!res.ok) { navigate('/'); return }
      const { session } = await res.json()
      if (!session) { navigate('/'); return }

      const matchRes = await fetch(`/api/match/${sessionId}`)
      const matchData = await matchRes.json()
      const matches = matchData.matches || []

      const hasPlayers = session.players?.length > 0
      const hasMatches = matches.length > 0
      const hasUnplayed = matches.some(m => !m.played)
      const isFinished = session.finished

      const hRes = await fetch(`/api/game/${sessionId}/history`)
      const hData = await hRes.json()
      const hasHistory = hData.history?.length > 0

      let correctPage
      if (!hasPlayers) {
        correctPage = 'wheel'
      } else if (!hasMatches && !isFinished) {
        correctPage = 'squad'
      } else if (hasMatches && (hasUnplayed || !isFinished)) {
        correctPage = 'season'
      } else if (isFinished && !hasHistory) {
        correctPage = 'results'
      } else if (isFinished && hasHistory) {
        correctPage = 'end-season'
      } else {
        correctPage = currentPage
      }

      if (correctPage !== currentPage) {
        switch (correctPage) {
          case 'wheel': navigate(`/wheel/${sessionId}`); break
          case 'squad': navigate(`/squad/${sessionId}`); break
          case 'season': navigate(`/season/${sessionId}`); break
          case 'results': navigate(`/results/${sessionId}`); break
          case 'end-season': navigate(`/end-season/${sessionId}`); break
        }
      }
    } catch (err) {
      console.error(err)
      navigate('/')
    } finally {
      setChecked(true)
    }
  }

  return checked
}