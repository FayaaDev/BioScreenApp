import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useNativeColorScheme } from 'react-native';
import { configureUILibrary } from '../lib/uiLibConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors as UIColors } from 'react-native-ui-lib';

type Theme = 'zimamDark' | 'zimamLight';

interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    colors: typeof UIColors;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemScheme = useNativeColorScheme();
    const [theme, setTheme] = useState<Theme>('zimamDark');

    useEffect(() => {
        // Load saved theme or default to system (mapped to zimam)
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('app_theme');
            if (savedTheme === 'zimamDark' || savedTheme === 'zimamLight') {
                setTheme(savedTheme);
                configureUILibrary(savedTheme);
            } else {
                // Default to dark if system is dark, else light
                const defaultTheme = systemScheme === 'dark' ? 'zimamDark' : 'zimamLight';
                // Actually, user wants default to be Dark? "Zimam Dark (Default)" in Colors.ts
                // Let's stick to saved or default zimamDark
                setTheme('zimamDark');
                configureUILibrary('zimamDark');
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newTheme = theme === 'zimamDark' ? 'zimamLight' : 'zimamDark';
        setTheme(newTheme);
        configureUILibrary(newTheme);
        await AsyncStorage.setItem('app_theme', newTheme);
    };

    const isDark = theme === 'zimamDark';

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors: UIColors }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
