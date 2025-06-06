export function detectDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  // Check if iOS
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  
  // Check if Android
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  // Default to iOS for unknown devices (as fallback)
  return 'ios';
}

export function getSehhatyAppLink() {
  const device = detectDevice();
  
  if (device === 'ios') {
    return 'https://apps.apple.com/sa/app/%D8%B5%D8%AD%D8%AA%D9%8A-sehhaty/id1459266578?l=ar';
  } else {
    return 'https://play.google.com/store/apps/details?id=com.lean.sehhaty&hl=en';
  }
}