import { useCallback, useEffect } from 'react';
import API from '../api';
import { setCookie } from '../lib/cookies';
import useConversation from './useConversation';

type RegisterResponse = {
  userId: string;
  isNew: boolean;
};

const useSetup = () => {
  const conversation = useConversation();

  const getId = useCallback(async () => {
    const response = await API.get<RegisterResponse>('register');
    setCookie('userId', response.userId);
    conversation();
  }, [conversation]);

  useEffect(() => {
    getId();
  }, [getId]);
};

export default useSetup;
