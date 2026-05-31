import { create } from 'zustand'

const useGameStore = create((set) => ({
  session: null,
  players: [],
  matches: [],
  standings: [],
  finalScore: null,

  setSession: (session) => set({ session }),
  setPlayers: (players) => set({ players }),
  setMatches: (matches) => set({ matches }),
  setStandings: (standings) => set({ standings }),
  setFinalScore: (finalScore) => set({ finalScore }),
  reset: () => set({
    session: null,
    players: [],
    matches: [],
    standings: [],
    finalScore: null,
  }),
}))

export default useGameStore