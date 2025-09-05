import { createContext } from 'react';
import type { ConvoContextValue } from '../types';

const convoContext = createContext<ConvoContextValue>({
  input: '',
  isConvoMode: false,
  confidence: 0,
  messages: [],
  addMessage: () => {},
  set: () => {
    // Do Nothing
  },
});

export default convoContext;
