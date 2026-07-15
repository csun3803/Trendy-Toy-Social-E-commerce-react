import React, { useEffect } from 'react';
import { useModel, history } from '@umijs/max';

const HomeRedirect: React.FC = () => {
  const { initialState } = useModel('@@initialState');

  useEffect(() => {
    if (initialState?.currentUser) {
      if (initialState.currentUser.access === 'merchant') {
        history.push('/merchant/dashboard');
      } else if (initialState.currentUser.access === 'admin') {
        history.push('/admin-dashboard');
      }
    } else {
      history.push('/user/login');
    }
  }, [initialState]);

  return null;
};

export default HomeRedirect;
