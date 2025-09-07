import { useContext, type FC } from "react"
import App from "../context/assessment"
import Convo from "../context/convo"

const Recommendation: FC = () => {
  const { recommendation, locationName } = useContext(App.Context)
  const { messages } = useContext(Convo.Context)

  if (!messages) {
    return null
  }

  if (!recommendation && !locationName) {
    return null
  }

  return (
    <div className="text-center px-3 sm:px-4 py-3 sm:py-4 md:py-6">
      <div className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 dark:text-neutral-200 mb-1.5 sm:mb-2 leading-tight">
        {locationName}
      </div>
      <div className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-neutral-400 leading-relaxed max-w-prose mx-auto">
        {recommendation}
      </div>
    </div>
  )
}


export default Recommendation