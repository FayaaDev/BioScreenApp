import { getStoredLanguage } from "@/lib/languageManager";
import { View, Text } from "react-native";
import { I18nManager } from "react-native";
import { useState, useEffect } from "react";
import * as Updates from 'expo-updates';

export function DirectionTester() {
  const [language, setLanguage] = useState("");

  useEffect(() => {
    void (async () => {
      const storedLanguage = await getStoredLanguage();
      setLanguage(storedLanguage);
      const shouldBeRtl = storedLanguage === "ar";
    })();
  }, []);

  return (
    <View
      style={{
        padding: 64,
        
      }}
    >
      <Text
        style={{
          // textAlign: "left"
        }}
      >StoredLanguage: {language}</Text>
      <Text>Direction: {I18nManager.isRTL ? "rtl" : "ltr"}</Text>
    </View>
  );
}
