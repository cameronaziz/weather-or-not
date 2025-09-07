import { useCallback, useContext, useRef } from 'react';
import API from '../api';
import Convo from '../context/convo';
import { getURLParam, setURLParam } from '../lib/urlParams';
import type {
  CreateConversationResponse,
  GetConversationResponse,
} from '../types';

const useConversation = () => {
  const { addMessage, set } = useContext(Convo.Context);
  const hasGottenConversation = useRef(false);

  const createConversation = useCallback(async () => {
    const response = await API.post<CreateConversationResponse>('conversation');
    setURLParam('convoId', response.convoId);
  }, []);

  const getConversation = useCallback(async () => {
    const convoId = getURLParam('convoId');
    if (convoId) {
      const response = await API.get<GetConversationResponse>('conversation', {
        convoId,
      });
      if (response.messages) {
        addMessage(response.messages);
      } else {
        await createConversation();
      }
    }
  }, [addMessage, createConversation]);

  const conversation = useCallback(async () => {
    set('isLoading', true);
    if (hasGottenConversation.current) {
      return;
    }
    hasGottenConversation.current = true;
    const convoId = getURLParam('convoId');
    if (convoId) {
      await getConversation();
    } else {
      await createConversation();
    }
    set('isLoading', false);
  }, [createConversation, getConversation, set]);

  return conversation;
};

export default useConversation;
