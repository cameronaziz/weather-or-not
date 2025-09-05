import { useCallback, useContext, useState } from 'react';
import API from '../api';
import Assessment from '../context/assessment';
import Convo from '../context/convo';
import sanitizeUserInput from '../lib/sanitize';
import { getURLParam, setURLParam } from '../lib/urlParams';
import type { RequestResult } from '../types';

type UseSendPrompt = () => [
  isLoading: boolean,
  sendPrompt: (prompt: string) => void
];

const useSendPrompt: UseSendPrompt = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { set: setAssessmentContext, reset } = useContext(Assessment.Context);
  const { set: setConvoContext, addMessage } = useContext(Convo.Context);

  const sendPrompt = useCallback(
    async (input: string) => {
      const prompt = sanitizeUserInput(input);
      setIsLoading(true);
      reset();

      addMessage({
        role: 'user',
        text: prompt,
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
            setAssessmentContext('locationName', message);
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
              });
              setConvoContext({
                isConvoMode: true,
                input: '',
              });
              setURLParam('convoId', convoId);
            }
            break;
          }
          case 'complete':
            setAssessmentContext({
              ...response.data,
            });
            setConvoContext({
              input: '',
            });
            setURLParam('convoId', response.convoId);
            break;
        }
      }
      setIsLoading(false);
    },
    [addMessage, reset, setAssessmentContext, setConvoContext]
  );

  return [isLoading, sendPrompt];
};

export default useSendPrompt;
