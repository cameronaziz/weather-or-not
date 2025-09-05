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
    <div ref={ref} className="flex flex-col w-full h-full overflow-y-auto">
      {messages.map((message) => (
        <div key={message.id} className={clsx('chat animate-bounce-in', {
          'chat-start': message.role !== 'user',
          'chat-end': message.role === 'user',
        })}>
          <div className={clsx('chat-bubble', {
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