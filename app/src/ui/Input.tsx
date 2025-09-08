import clsx from "clsx"
import { useCallback, useContext, useEffect, useMemo, useRef, type ChangeEvent, type FC } from "react"
import API from "../api"
import Convo from "../context/convo"
import useSendPrompt from "../hooks/useSendPrompt"
import useViewportHeight from "../hooks/useViewportHeight"
import { setURLParam } from "../lib/urlParams"
import type { CreateConversationResponse } from "../types"

const placeholders = [
  'I\'m good, but I\'m not THAT good.',
  'I\'m waiting to shock you',
  'Seriously? Try being more specific this time...',
  'To be a poet is a condition, not a profession.',
  'Riddles are cool'
]

const NewConvo: FC = () => {
  const { set: setConvo, messages } = useContext(Convo.Context)


  const onClick = useCallback(async () => {
    setConvo({
      isLoading: true,
      messages: [],
      isConvoMode: false
    })
    const response = await API.post<CreateConversationResponse>('conversation');
    setURLParam('convoId', response.convoId);
    setConvo('isLoading', false)
  }, [setConvo])

  if (messages.length === 0) {
    return null
  }

  return (
    <div className="absolute left-1/2 mt-2 sm:mt-3 -translate-x-1/2 translate-y-full">
      <button onClick={onClick} className="cursor-pointer hover:text-gray-700 text-xs sm:text-sm px-1 py-0.5 min-h-[36px] h-auto touch-manipulation">New Conversation</button>
    </div>
  )
}

const Input: FC = () => {
  const sendPrompt = useSendPrompt()
  const { input, isConvoMode, messages, set, isLoading } = useContext(Convo.Context)
  const { isSmallHeight } = useViewportHeight()
  const hasMessages = messages.length > 0
  const ref = useRef<HTMLInputElement>(null)

  const focus = useCallback(() => {
    const { current } = ref
    if (current) {
      current.focus()
    }
  }, [])

  const onSubmit = useCallback(async () => {
    const prompt = input.trim()
    if (prompt.length > 0 && !isLoading) {
      await sendPrompt(input)
      focus()
    }
  }, [input, focus, isLoading, sendPrompt])


  useEffect(() => {
    focus()
    const onKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        onSubmit()
      }
    }
    window.addEventListener('keypress', onKeyPress)

    return () => {
      window.removeEventListener('keypress', onKeyPress)
    }
  }, [focus, onSubmit])

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    set('input', value)
  }, [set])

  const placeholder = useMemo(() => {
    if (isConvoMode) {
      return placeholders[Math.floor(Math.random() * placeholders.length)]
    }
    return messages.length > 0 ? 'What else can I help you wear?' : 'Try: \'Paris\' or \'where the Olympics are\''
  }, [isConvoMode, messages.length])

  const positionClasses = useMemo(() => ({
    "bottom-4 sm:bottom-6 md:bottom-8 mb-safe": hasMessages,
    "bottom-8 sm:bottom-12 md:bottom-16 mb-safe": !hasMessages && isSmallHeight,
    "bottom-[20vh] xs:bottom-[25vh] sm:bottom-[30vh] md:bottom-[35vh] lg:bottom-[40vh]": !hasMessages && !isSmallHeight,
  }), [hasMessages, isSmallHeight])

  return (
    <div className={clsx("fixed left-1/2 -translate-x-1/2 rounded-lg flex z-10 transition-all duration-700 ease-in-out mx-3", {
      ...positionClasses,
      'border border-solid border-blue-400': !isConvoMode,
      'w-[95vw] xs:w-[90vw] sm:w-[80vw] md:w-[70vw] lg:min-w-[40vw] max-w-2xl sm:mx-0': !hasMessages,
      'w-full max-w-xl': hasMessages,
    })}>
      <div className="w-full">
        <label
          htmlFor="prompt-input"
          className="block text-sm text-gray-700 font-medium dark:text-white"
        >
          <span className="sr-only">{placeholder}</span>
        </label>
        <input
          ref={ref}
          type="text"
          id="prompt-input"
          onChange={onChange}
          value={input}
          disabled={isLoading}
          className={clsx('py-3 sm:py-2.5 md:py-3 pl-3 sm:pl-4 pr-12 sm:pr-14 bg-white dark:bg-gray-600 focus:outline-hidden block w-full rounded-lg transition-all duration-700 ease-in-out text-sm sm:text-base min-h-[44px] touch-manipulation', {
            'border-transparent': isConvoMode,
            'bg-gray-300 text-gray-500': isLoading,
          })}
          placeholder={placeholder}
        />
      </div>
      <button
        disabled={isLoading || input.trim().length === 0}
        onClick={onSubmit}
        className={clsx("absolute right-1 top-1 bottom-1 aspect-square p-1 inline-flex focus:outline-hidden justify-center items-center text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none transition-colors duration-300 ease-in-out touch-manipulation", {
          'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700': !isConvoMode,
          'bg-orange-600 text-black hover:bg-orange-700 focus:bg-orange-700': isConvoMode,
        })}
      >
        <span className={clsx({
          'loading loading-spinner': isLoading
        })}>{isLoading ? '' : '⇪'}</span>
      </button>
      <NewConvo />
    </div>
  )
}

export default Input