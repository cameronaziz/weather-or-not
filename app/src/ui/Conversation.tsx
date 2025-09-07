import clsx from "clsx";
import { useContext, useEffect, useRef, type FC } from "react";
import Convo from "../context/convo";

const Conversation: FC = () => {
  const { messages } = useContext(Convo.Context)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const { current } = ref
    if (current) {
      current.scrollTo({
        top: current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages.length])

  if (!messages) {
    return null
  }

  return (
    <div ref={ref} className="flex flex-col w-full h-full overflow-y-auto px-2 sm:px-3 md:px-4 scrollbar-hide">
      {messages.map((message) => (
        <div key={message.id} className={clsx('chat animate-bounce-in mb-3 sm:mb-4 md:mb-6', {
          'chat-start': message.role !== 'user',
          'chat-end': message.role === 'user',
        })}>
          <div className={clsx('chat-bubble max-w-[90%] xs:max-w-[85%] sm:max-w-[80%] md:max-w-[70%] text-sm sm:text-base md:text-base leading-relaxed p-3 sm:p-4 shadow-sm', {
            'chat-bubble-neutral': message.role !== 'user',
            '': message.role === 'user',
          })}>
            {message.text}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Conversation