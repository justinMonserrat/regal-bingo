import { useEffect, useState } from 'react'

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQueryList = window.matchMedia(query)
    const listener = (event) => setMatches(event.matches)

    mediaQueryList.addEventListener('change', listener)
    setMatches(mediaQueryList.matches)

    return () => mediaQueryList.removeEventListener('change', listener)
  }, [query])

  return matches
}

export default useMediaQuery

