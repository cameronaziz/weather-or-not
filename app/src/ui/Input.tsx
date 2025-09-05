import clsx from "clsx"
import { useCallback, useContext, useEffect, useRef, type ChangeEvent, type FC } from "react"
import Convo from "../context/convo"
import useSendPrompt from "../hooks/useSendPrompt"

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
  }, [onSubmit])

  const onChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    set('input', value)
  }, [set])

  return (
    <div className={clsx("fixed left-1/2 -translate-x-1/2 flex z-10 min-w-[40vw] transition-all duration-700 ease-in-out", {
      "bottom-[40vh]": !hasMessages,
      "bottom-[10vh]": hasMessages
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
          className={clsx('py-2.5 pl-4 px-16 bg-white focus:outline-hidden block w-full rounded-lg transition-colors duration-300 ease-in-out', {
            'border-transparent': isConvoMode,
            'border border-solid border-blue-400': !isConvoMode,
            'bg-gray-300': loading
          })}
          placeholder="Search Weather"
        />
      </div>
      <button
        disabled={loading}
        onClick={onSubmit}
        className={clsx("absolute right-0 size-11 inline-flex focus:outline-hidden justify-center items-center gap-x-2 text-sm font-medium rounded-lg border border-transparent disabled:opacity-50 disabled:pointer-events-none transition-colors duration-300 ease-in-out", {
          'bg-blue-600 text-white h-full hover:bg-blue-700 focus:bg-blue-700': !isConvoMode,
          'bg-orange-600 text-black hover:bg-orange-700 focus:bg-orange-700': isConvoMode,
        })}
      >
        {loading ?
          <svg className="size-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg> :
          <svg className="shrink-0 size-5" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        }
      </button>
    </div>
  )
}

export default Input