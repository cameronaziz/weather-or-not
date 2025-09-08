import clsx from "clsx";
import { useContext, useEffect, useMemo, useRef, type FC } from "react";
import Convo from "../context/convo";
import type { Message } from "../types";

const LoadingContent: FC = () => {
  return (
    <svg width="40" height="15" viewBox="0 0 60 20" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="4" fill="#fff">
        <animate
          attributeName="r"
          values="4;6;4"
          dur="1.2s"
          repeatCount="indefinite"
          begin="0s"
        />
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1.2s"
          repeatCount="indefinite"
          begin="0s"
        />
      </circle>
      <circle cx="30" cy="10" r="4" fill="#fff">
        <animate
          attributeName="r"
          values="4;6;4"
          dur="1.2s"
          repeatCount="indefinite"
          begin="0.2s"
        />
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1.2s"
          repeatCount="indefinite"
          begin="0.2s"
        />
      </circle>
      <circle cx="50" cy="10" r="4" fill="#fff">
        <animate
          attributeName="r"
          values="4;6;4"
          dur="1.2s"
          repeatCount="indefinite"
          begin="0.4s"
        />
        <animate
          attributeName="opacity"
          values="0.3;1;0.3"
          dur="1.2s"
          repeatCount="indefinite"
          begin="0.4s"
        />
      </circle>
    </svg>
  )
}

type ChatBubbleProps = {
  message: Message
}

const ChatBubble: FC<ChatBubbleProps> = (props) => {
  const { message } = props
  const isLoading = message.id === 'last-message' && message.text === ''
  const isSystem = message.role !== 'user'
  const isUser = message.role === 'user'

  return (
    <div className={clsx('chat animate-bounce-in mb-0.5 sm:mb-1', {
      'chat-start': isSystem,
      'chat-end': isUser,
      'mb-0': message.id === 'last-message'
    })}>
      <div className={clsx('chat-bubble max-w-[90%] xs:max-w-[85%] sm:max-w-[80%] md:max-w-[70%] text-sm sm:text-base md:text-base leading-relaxed p-2 m-0 sm:p-3 shadow-sm', {
        'chat-bubble-neutral': isSystem,
      })}>
        <div className="relative">
          {isLoading ? <LoadingContent /> : message?.text}
        </div>
      </div>
    </div>
  )
}

const Conversation: FC = () => {
  const { messages, isLoading } = useContext(Convo.Context)
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

  const messageList = useMemo(() => {
    const list = [...messages]
    if (list.length > 0) {
      if (isLoading) {
        list.push({
          role: 'model',
          text: '',
          id: 'last-message'
        })
      } else {
        if (list[list.length - 1]?.role === 'model') {
          list[list.length - 1].id = 'last-message'
        }
      }
    }
    return list
  }, [messages, isLoading])

  if (messageList.length === 0) {
    return null
  }

  return (
    <div ref={ref} className="flex flex-col w-full h-full overflow-y-auto px-1 sm:px-2 md:px-3 scrollbar-hide">
      {messageList.map((message) => (
        <ChatBubble key={message.id} message={message} />
      ))}
    </div>
  );
};


export default Conversation