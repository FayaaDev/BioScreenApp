import { Platform, Linking } from 'react-native';

export function getSehhatyAppLink(): string {
  // Return the Sehhaty app deep link or store URL
  if (Platform.OS === 'ios') {
    return 'https://apps.apple.com/sa/app/seha/id1446089404';
  } else {
    return 'https://play.google.com/store/apps/details?id=sa.gov.nhic.seha';
  }
}

export async function openSehhatyApp(): Promise<void> {
  const url = getSehhatyAppLink();
  const supported = await Linking.canOpenURL(url);
  
  if (supported) {
    await Linking.openURL(url);
  } else {
    console.error("Cannot open Sehhaty app URL");
  }
} 