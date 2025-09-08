import clsx from 'clsx';
import { useContext, type FC } from 'react';
import Convo from './context/convo';
import useSetup from './hooks/useSetup';
import './index.css';
import Conversation from './ui/Conversation';
import Header from './ui/Header';
import Input from './ui/Input';
import Recommendation from './ui/Recommendation';

const WeatherOrNot: FC = () => {
  const { isConvoMode, messages } = useContext(Convo.Context)
  useSetup()

  const hasMessages = messages.length > 0

  return (
    <div className={clsx("relative h-dvh transition-colors duration-500 ease-in-out px-3 sm:px-6 md:px-8 lg:px-[15vw] xl:px-[20vw] pb-safe", {
      'bg-purple-300': isConvoMode
    })}>
      <div className={clsx("transition-all duration-700 ease-in-out", {
        "flex flex-col items-center justify-center h-dvh gap-6 sm:gap-8 md:gap-12": !hasMessages,
      })}>
        <Header />
        <div className={clsx("mx-auto max-w-xl transition-opacity duration-100 delay-300 ease-in-out", {
          "opacity-0": !hasMessages,
          "pt-32 sm:pt-36 md:pt-40 lg:pt-44 pb-20 sm:pb-24 md:pb-28 h-dvh opacity-100 overflow-hidden": hasMessages
        })}>
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto scrollbar-hide min-h-0">
              <Conversation />
              <Recommendation />
            </div>
          </div>
        </div>
      </div>
      <Input />
    </div >
  )
}

export default WeatherOrNot