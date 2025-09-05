import { useContext, type FC } from "react"
import App from "../context/assessment"

const Recommendation: FC = () => {
  const { recommendation, locationName } = useContext(App.Context)

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