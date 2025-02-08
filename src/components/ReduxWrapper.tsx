import React from 'react';
import { Provider } from 'react-redux';
import store from '../store';

interface ReduxWrapperProps {
  children: React.ReactNode;
}

export default function ReduxWrapper({ children }: ReduxWrapperProps) {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
}
