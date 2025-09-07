import { useState, useEffect } from 'react'

const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight)
  const [isSmallHeight, setIsSmallHeight] = useState(window.innerHeight < 600)

  useEffect(() => {
    const handleResize = () => {
      const height = window.innerHeight
      setViewportHeight(height)
      setIsSmallHeight(height < 600)
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return { viewportHeight, isSmallHeight }
}

export default useViewportHeight