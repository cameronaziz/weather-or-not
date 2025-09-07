import { createContext } from 'react';
import type { ConvoContextValue } from '../types';

const convoContext = createContext<ConvoContextValue>({
  input: '',
  isLoading: false,
  isConvoMode: false,
  confidence: 0,
  messages: [],
  addMessage: () => {},
  set: () => {
    // Do Nothing
  },
});

export default convoContext;
