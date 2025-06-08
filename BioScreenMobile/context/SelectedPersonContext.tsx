import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SelectedPerson {
  id: number;
  name: string;
  dateOfBirth?: string;
  gender?: string;
}

interface SelectedPersonContextType {
  selectedPersonId: string;
  setSelectedPersonId: (id: string) => void;
  selectedPerson: SelectedPerson | null;
  setSelectedPerson: (person: SelectedPerson | null) => void;
}

export const SelectedPersonContext = createContext<SelectedPersonContextType>({
  selectedPersonId: 'user',
  setSelectedPersonId: (id: string) => {},
  selectedPerson: null,
  setSelectedPerson: (person: SelectedPerson | null) => {},
});

export const SelectedPersonProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedPersonId, setSelectedPersonId] = useState('user');
  const [selectedPerson, setSelectedPerson] = useState<SelectedPerson | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('selectedPersonId').then(id => {
      if (id) setSelectedPersonId(id);
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('selectedPersonId', selectedPersonId);
  }, [selectedPersonId]);

  return (
    <SelectedPersonContext.Provider value={{ 
      selectedPersonId, 
      setSelectedPersonId, 
      selectedPerson, 
      setSelectedPerson 
    }}>
      {children}
    </SelectedPersonContext.Provider>
  );
};

export const useSelectedPerson = () => {
  const context = useContext(SelectedPersonContext);
  if (context === undefined) {
    throw new Error('useSelectedPerson must be used within a SelectedPersonProvider');
  }
  return context;
}; 