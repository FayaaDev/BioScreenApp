import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share, Alert } from 'react-native';

/**
 * BackupService
 * Handles exporting and importing of all app data to/from JSON.
 * 
 * Note: Ideally this would use expo-file-system and expo-sharing to create actual files,
 * but for now we use React Native's Share to share the JSON string.
 */

export const BackupService = {
    /**
     * Export all data from AsyncStorage related to the app
     */
    exportData: async (): Promise<void> => {
        try {
            // 1. Get all keys
            const keys = await AsyncStorage.getAllKeys();

            // 2. Filter keys specific to our app to avoid exporting unrelated data
            // We look for keys starting with known prefixes or just export everything if safe
            // Known prefixes from medical-storage.ts: 
            // user_profile_, family_members_, tests_list_, screenings_, onboarding_completed_, test_
            const appKeys = keys.filter(key =>
                key.startsWith('user_profile_') ||
                key.startsWith('family_members_') ||
                key.startsWith('tests_list_') ||
                key.startsWith('screenings_') ||
                key.startsWith('onboarding_completed_') ||
                key.startsWith('test_')
            );

            if (appKeys.length === 0) {
                Alert.alert('No Data', 'There is no data to export.');
                return;
            }

            // 3. Get values for these keys
            const stores = await AsyncStorage.multiGet(appKeys);

            // 4. Construct export object
            const exportData: Record<string, any> = {
                meta: {
                    version: 1,
                    timestamp: new Date().toISOString(),
                    app: 'BioScreen/Zimam',
                },
                data: {}
            };

            stores.forEach(([key, value]) => {
                if (value) {
                    try {
                        exportData.data[key] = JSON.parse(value);
                    } catch (e) {
                        // If not JSON, store as string
                        exportData.data[key] = value;
                    }
                }
            });

            // 5. Convert to string
            const jsonString = JSON.stringify(exportData, null, 2);

            // 6. Share
            const result = await Share.share({
                message: jsonString,
                title: 'Zimam_Backup.json',
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType
                } else {
                    // shared
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
            }
        } catch (error) {
            console.error('Export failed:', error);
            Alert.alert('Export Failed', 'An error occurred while exporting data.');
        }
    },

    /**
     * Import data from a JSON string
     * @param jsonString The JSON string to import
     */
    importData: async (jsonString: string): Promise<boolean> => {
        try {
            // 1. Parse JSON
            const importData = JSON.parse(jsonString);

            // 2. Validate structure
            if (!importData.meta || !importData.data) {
                throw new Error('Invalid backup format');
            }

            // 3. Confirm with user (Caller should handle UI confirmation, but we can do a check here)
            // For this service, we assume confirmation is done.

            // 4. Clear existing app data first to avoid conflicts?
            // Or just overwrite. Overwriting is safer if we want to merge, but for restore, clearing is cleaner.
            // Let's overwrite keys present in the backup.

            const pairs: [string, string][] = [];

            Object.entries(importData.data).forEach(([key, value]) => {
                if (typeof value === 'object') {
                    pairs.push([key, JSON.stringify(value)]);
                } else {
                    pairs.push([key, String(value)]);
                }
            });

            if (pairs.length > 0) {
                await AsyncStorage.multiSet(pairs);
            }

            return true;
        } catch (error) {
            console.error('Import failed:', error);
            Alert.alert('Import Failed', 'Invalid data format. Please check the backup file.');
            return false;
        }
    }
};
