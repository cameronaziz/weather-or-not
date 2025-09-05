import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import API from '../api';
import Convo from '../context/convo';
import { setCookie } from '../lib/cookies';
import { getURLParam, setURLParam } from '../lib/urlParams';
import type { Message } from '../types';

type RegisterResponse = {
  userId: string;
  isNew: boolean;
};

type ConversationResponse = {
  messages: Message[];
};

const useSetup = () => {
  const { addMessage } = useContext(Convo.Context);
  const [userId, setUserId] = useState<string | null>(null);
  const hasSetMessagesRef = useRef(false);

  const getId = useCallback(async () => {
    const response = await API.get<RegisterResponse>('register');
    setCookie('userId', response.userId);
    setUserId(response.userId);
  }, []);

  const getConversation = useCallback(async () => {
    if (hasSetMessagesRef.current) {
      return;
    }
    hasSetMessagesRef.current = true;
    const convoId = getURLParam('convoId');
    if (convoId) {
      const response = await API.get<ConversationResponse>('conversation', {
        convoId,
      });
      console.log(response);
      if (response.messages) {
        addMessage(response.messages);
      } else {
        setURLParam('convoId');
      }
    }
  }, [addMessage]);

  useEffect(() => {
    getId();
  }, [getId]);

  useEffect(() => {
    getConversation();
  }, [getConversation, userId]);
};

export default useSetup;
