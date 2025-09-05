import { createRoot } from 'react-dom/client'
import WeatherOrNot from './WeatherOrNot'
import App from './context/assessment'
import Convo from './context/convo'

createRoot(document.getElementById('root')!).render(
  <App.Provider>
    <Convo.Provider>
      <WeatherOrNot />
    </Convo.Provider>
  </App.Provider>,
)
