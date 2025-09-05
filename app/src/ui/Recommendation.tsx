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
    <div className="text-center">
      <div>
        {locationName}
      </div>
      <div>
        {recommendation}
      </div>
    </div>
  )
}


export default Recommendation