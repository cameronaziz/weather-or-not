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
    <div className="text-center px-4 py-4">
      <div className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-neutral-200 mb-2">
        {locationName}
      </div>
      <div className="text-sm sm:text-base text-gray-600 dark:text-neutral-400">
        {recommendation}
      </div>
    </div>
  )
}


export default Recommendation