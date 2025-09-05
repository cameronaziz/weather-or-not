import { useCallback, useContext, useState } from 'react';
import API from '../api';
import Convo from '../context/convo';
import sanitizeUserInput from '../lib/sanitize';
import { getURLParam, setURLParam } from '../lib/urlParams';
import type { RequestResult } from '../types';

type UseSendPrompt = () => [
  isLoading: boolean,
  sendPrompt: (prompt: string) => Promise<void>
];

const useSendPrompt: UseSendPrompt = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { set: setConvoContext, addMessage } = useContext(Convo.Context);

  const sendPrompt = useCallback(
    async (input: string) => {
      const prompt = sanitizeUserInput(input);
      setIsLoading(true);
      setConvoContext('input', '');

      addMessage({
        role: 'user',
        text: prompt,
        id: `${Math.random()}`,
      });

      const payload = {
        convoId: getURLParam('convoId'),
        prompt,
      };
      const stream = API.post<RequestResult>(payload, 'prompt');

      for await (const response of stream) {
        switch (response.action) {
          case 'location_confirmed': {
            const {
              data: { message },
              convoId,
            } = response;
            setURLParam('convoId', convoId);
            addMessage({
              role: 'system',
              text: message,
              id: `${Math.random()}`,
            });
            break;
          }
          case 'followup': {
            const {
              data: { question },
              convoId,
            } = response;
            if (question) {
              addMessage({
                role: 'system',
                text: question,
                id: `${Math.random()}`,
              });
              setConvoContext({
                isConvoMode: true,
              });
              setURLParam('convoId', convoId);
            }
            break;
          }
          case 'complete':
            addMessage({
              role: 'system',
              text: response.data.recommendation,
              id: `${Math.random()}`,
            });
            setURLParam('convoId', response.convoId);
            break;
        }
      }
      setIsLoading(false);
    },
    [addMessage, setConvoContext]
  );

  return [isLoading, sendPrompt];
};

export default useSendPrompt;
