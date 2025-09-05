import { useCallback, useMemo, useState, type FC, type ReactNode } from "react"
import type { AssessmentContextValue, SetAssessmentContext } from "../types"
import assessmentContext from "./assessmentContext"

type AssessmentContextProviderProps = {
  children: ReactNode
}

const AssessmentContextProvider: FC<AssessmentContextProviderProps> = (props) => {
  const { children } = props
  const [locationName, setLocationName] = useState<string>('')
  const [recommendation, setRecommendation] = useState<string>('')

  const reset = useCallback(() => {
    setLocationName('')
    setRecommendation('')
  }, [])

  const set: SetAssessmentContext = useCallback((...params) => {
    if (typeof params[0] === 'object') {
      const [partial] = params
      if (typeof partial.recommendation !== 'undefined') {
        setRecommendation(partial.recommendation)
      }
      if (typeof partial.locationName !== 'undefined') {
        setLocationName(partial.locationName)
      }
    } else {
      const [key, value] = params
      switch (key) {
        case 'recommendation':
          setRecommendation(value as string) // I dont like this
          break
        case 'locationName':
          setLocationName(value as string) // I dont like this
          break
        default:
        // Do Nothing
      }
    }
  }, [])

  const value = useMemo((): AssessmentContextValue => ({
    locationName,
    recommendation,
    set,
    reset,
  }), [locationName, recommendation, set, reset])

  return (
    <assessmentContext.Provider value={value}>
      {children}
    </assessmentContext.Provider>
  )

}

export default AssessmentContextProvider