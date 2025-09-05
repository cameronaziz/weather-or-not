import { useCallback, useMemo, useState, type FC, type ReactNode } from "react"
import type { ConvoContextValue, Message, SetConvoContext } from "../types"
import convoContext from "./convoContext"

type ConvoContextProviderProps = {
  children: ReactNode
}

const ConvoContextProvider: FC<ConvoContextProviderProps> = (props) => {
  const { children } = props
  const [messages, setMessages] = useState<Message[]>([])
  const [confidence, setConfidence] = useState<number>(0)
  const [isConvoMode, setIsConvoMode] = useState<boolean>(false)
  const [input, setInput] = useState<string>('')

  const addMessage = useCallback((message: Message | Message[]) => {
    setMessages(prev => {
      const messages = Array.isArray(message) ? message : [message]
      return [...prev, ...messages]
    })
  }, [])

  const set: SetConvoContext = useCallback((...params) => {
    if (typeof params[0] === 'object') {
      const [partial] = params
      if (typeof partial.isConvoMode !== 'undefined') {
        setIsConvoMode(partial.isConvoMode)
      }
      if (typeof partial.confidence !== 'undefined') {
        setConfidence(partial.confidence)
      }
      if (typeof partial.messages !== 'undefined') {
        setMessages(partial.messages)
      }

      if (typeof partial.input !== 'undefined') {
        setInput(partial.input)
      }
    } else {
      const [key, value] = params
      switch (key) {
        case 'isConvoMode':
          setIsConvoMode(value as boolean) // I dont like this
          break
        case 'confidence':
          setConfidence(value as number) // I dont like this
          break
        case 'messages':
          setMessages(value as Message[]) // I dont like this
          break
        case 'input':
          setInput(value as string)
          break
        default:
        // Do Nothing
      }
    }
  }, [])

  const value = useMemo((): ConvoContextValue => ({
    messages,
    isConvoMode,
    addMessage,
    input,
    confidence,
    set,
  }), [messages, input, isConvoMode, addMessage, confidence, set])

  return (
    <convoContext.Provider value={value}>
      {children}
    </convoContext.Provider>
  )

}

export default ConvoContextProvider