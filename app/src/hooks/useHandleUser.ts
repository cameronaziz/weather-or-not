import { useCallback, useEffect } from 'react';
import API from '../api';
import { setCookie } from './../lib/cookies';

type RegisterResponse = {
  userId: string;
  isNew: boolean;
};

const useHandleUser = () => {
  const getId = useCallback(async () => {
    const response = await API.get<RegisterResponse>('register');
    setCookie('userId', response.userId);
  }, []);

  useEffect(() => {
    getId();
  }, [getId]);
};

export default useHandleUser;
