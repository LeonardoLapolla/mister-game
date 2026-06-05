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

      const hasPlayers = session.players?.length > 0
      const isFinished = session.finished

      // Nessun giocatore → wheel
      if (!hasPlayers) {
        if (currentPage !== 'wheel') navigate(`/wheel/${sessionId}`)
        return
      }

      // Stagione finita → results o end-season sono entrambi validi
      if (isFinished) {
        if (currentPage !== 'results' && currentPage !== 'end-season') {
          navigate(`/results/${sessionId}`)
        }
        return
      }

      // Non finita → controlla partite
      const matchRes = await fetch(`/api/match/${sessionId}`)
      const matchData = await matchRes.json()
      const matches = matchData.matches || []
      const hasMatches = matches.length > 0

      if (!hasMatches) {
        // Nessuna partita → squad o season vanno bene
        if (currentPage !== 'squad' && currentPage !== 'season') {
          navigate(`/squad/${sessionId}`)
        }
        return
      }

      const hasUnplayed = matches.some(m => !m.played)
      const isFirstLegOnly = !hasUnplayed && matches.length <= 20

      if (isFirstLegOnly) {
        // Solo andata simulata — deve passare per squad per generare il ritorno
        if (currentPage !== 'squad' && currentPage !== 'season') {
          navigate(`/squad/${sessionId}`)
        }
        return
      }

      // Ha partite complete → season
      if (currentPage === 'squad') {
        const urlParams = new URLSearchParams(window.location.search)
        const mode = urlParams.get('mode')
        navigate(`/season/${sessionId}${mode ? `?mode=${mode}` : ''}`)
        return
      }

      if (currentPage !== 'season') {
        navigate(`/season/${sessionId}`)
      }

    } catch (err) {
      console.error(err)
    } finally {
      setChecked(true)
    }
  }

  return checked
}