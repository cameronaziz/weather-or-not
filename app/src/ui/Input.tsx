import clsx from "clsx"
import { useCallback, useContext, useEffect, useMemo, useRef, type ChangeEvent, type FC } from "react"
import Convo from "../context/convo"
import useSendPrompt from "../hooks/useSendPrompt"
import { getURLParam, setURLParam } from "../lib/urlParams"

const placeholders = [
  'Help the detective',
  'Challenge him some more',
  'Make him work',
  'Another clue?',
  'He\'s waiting',
]

const NewConvo: FC = () => {
  const { set } = useContext(Convo.Context)
  const isConvo = !!getURLParam('convoId')

  const onClick = useCallback(() => {
    setURLParam('convoId')
    set({
      messages: [],
      isConvoMode: false
    })
  }, [set])

  if (!isConvo) {
    return null
  }

  return (
    <div className="absolute left-1/2 mt-1 -translate-x-1/2 translate-y-full">
      <button onClick={onClick} className="btn btn-ghost">New Conversation</button>
    </div>
  )
}

const Input: FC = () => {
  const [loading, sendPrompt] = useSendPrompt()
  const { input, isConvoMode, messages, set } = useContext(Convo.Context)
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
    if (prompt.length > 0 && !loading) {
      await sendPrompt(input)
      focus()
    }
  }, [input, focus, loading, sendPrompt])


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
    return hasMessages ? 'Send' : 'Search Weather'
  }, [hasMessages, isConvoMode])

  return (
    <div className={clsx("fixed left-1/2 -translate-x-1/2 rounded-lg flex z-10 w-[90vw] sm:w-[80vw] md:min-w-[40vw] max-w-2xl transition-all duration-700 ease-in-out", {
      "bottom-[35vh] sm:bottom-[40vh]": !hasMessages,
      "bottom-[8vh] sm:bottom-[10vh]": hasMessages,
      'border border-solid border-blue-400': !isConvoMode,
    })}>
      <div className="w-full">
        <label
          htmlFor="prompt-input"
          className="block text-sm text-gray-700 font-medium dark:text-white"
        >
          <span className="sr-only">Search Weather</span>
        </label>
        <input
          ref={ref}
          type="text"
          id="prompt-input"
          onChange={onChange}
          value={input}
          disabled={loading}
          className={clsx('py-3 sm:py-2.5 pl-4 pr-16 bg-white dark:bg-gray-600 focus:outline-hidden block w-full rounded-lg transition-colors duration-300 ease-in-out text-base sm:text-sm', {
            'border-transparent': isConvoMode,
            'bg-gray-300': loading
          })}
          placeholder={placeholder}
        />
      </div>
      <button
        disabled={loading || input.trim().length === 0}
        onClick={onSubmit}
        className={clsx("h-full absolute right-0 w-fit p-3 inline-flex focus:outline-hidden justify-center items-center text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none transition-colors duration-300 ease-in-out", {
          'bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700': !isConvoMode,
          'bg-orange-600 text-black hover:bg-orange-700 focus:bg-orange-700': isConvoMode,
        })}
      >
        <span className={clsx({
          'loading loading-spinner': loading
        })}>{loading ? '' : '⇪'}</span>
      </button>
      <NewConvo />
    </div>
  )
}

export default Input