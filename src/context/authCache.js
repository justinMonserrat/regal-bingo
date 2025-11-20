const AUTH_CACHE_KEY = 'regal-bingo-auth-cache'

const hasWindow = () => typeof window !== 'undefined'

export const readCachedUser = () => {
  if (!hasWindow()) return null
  try {
    const serialized = window.localStorage.getItem(AUTH_CACHE_KEY)
    if (!serialized) return null
    const parsed = JSON.parse(serialized)
    if (parsed?.id) {
      return parsed
    }
  } catch {
    try {
      window.localStorage.removeItem(AUTH_CACHE_KEY)
    } catch {
      // ignore storage cleanup failures
    }
  }
  return null
}

export const persistCachedUser = (sessionUser) => {
  if (!hasWindow()) return
  try {
    if (sessionUser) {
      const snapshot = { id: sessionUser.id, email: sessionUser.email }
      window.localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(snapshot))
    } else {
      window.localStorage.removeItem(AUTH_CACHE_KEY)
    }
  } catch (error) {
    console.warn('Unable to persist auth cache', error)
  }
}

