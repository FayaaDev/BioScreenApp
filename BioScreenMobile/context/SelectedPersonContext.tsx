import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SelectedPersonContext = createContext({
  selectedPersonId: 'user',
  setSelectedPersonId: (id: string) => {},
});

export const SelectedPersonProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedPersonId, setSelectedPersonId] = useState('user');

  useEffect(() => {
    AsyncStorage.getItem('selectedPersonId').then(id => {
      if (id) setSelectedPersonId(id);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('selectedPersonId', selectedPersonId);
  }, [selectedPersonId]);

  return (
    <SelectedPersonContext.Provider value={{ selectedPersonId, setSelectedPersonId }}>
      {children}
    </SelectedPersonContext.Provider>
  );
}; 