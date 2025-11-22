import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SelectedPerson {
  id: string;
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
  setSelectedPersonId: (id: string) => { },
  selectedPerson: null,
  setSelectedPerson: (person: SelectedPerson | null) => { },
});

export const SelectedPersonProvider = ({ children }: { children: React.ReactNode }) => {
  const [selectedPersonId, setSelectedPersonId] = useState('user');
  const [selectedPerson, setSelectedPerson] = useState<SelectedPerson | null>(null);

  useEffect(() => {
    const loadSelectedPerson = async () => {
      try {
        const id = await AsyncStorage.getItem('selectedPersonId');
        if (id) {
          // Allow any non-empty string ID
          setSelectedPersonId(id);
        }
      } catch (error) {
        console.error('Failed to load selectedPersonId from AsyncStorage:', error);
        setSelectedPersonId('user');
      }
    };

    loadSelectedPerson();
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