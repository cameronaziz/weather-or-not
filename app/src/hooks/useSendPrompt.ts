import { useCallback, useContext } from 'react';
import API from '../api';
import Convo from '../context/convo';
import sanitizeUserInput from '../lib/sanitize';
import { getURLParam, setURLParam } from '../lib/urlParams';
import type { RequestResult } from '../types';

const useSendPrompt = () => {
  const { set: setConvoContext, addMessage } = useContext(Convo.Context);

  const sendPrompt = useCallback(
    async (input: string) => {
      const prompt = sanitizeUserInput(input);
      setConvoContext({
        input: '',
        isLoading: true,
      });

      addMessage({
        role: 'user',
        text: prompt,
        id: `${Math.random()}`,
      });

      const payload = {
        convoId: getURLParam('convoId'),
        prompt,
      };
      const stream = API.postStream<RequestResult>('prompt', payload);

      for await (const response of stream) {
        switch (response.action) {
          case 'location_confirmed': {
            const {
              data: { message },
              convoId,
            } = response;
            setURLParam('convoId', convoId);
            addMessage({
              role: 'model',
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
                role: 'model',
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
              role: 'model',
              text: response.data.recommendation,
              id: `${Math.random()}`,
            });
            setURLParam('convoId', response.convoId);
            break;
        }
      }
      setConvoContext('isLoading', false);
    },
    [addMessage, setConvoContext]
  );

  return sendPrompt;
};

export default useSendPrompt;
