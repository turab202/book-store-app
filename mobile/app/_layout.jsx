import { 
  Stack, 
  useRouter, 
  useSegments, 
  useRootNavigationState,
  Slot 
} from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import SafeScreen from "../components/SafeScreen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../store/authStore";
import { useEffect, useState } from "react";
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  const { checkAuth, user, token } = useAuthStore();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    "JetBrainsMono-Medium": require("../assets/fonts/JetBrainsMono-Medium.ttf"),
  });

  // Initialize auth and check when everything is ready
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check authentication
        await checkAuth();
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setIsAuthChecked(true);
      }
    };
    
    initializeApp();
  }, []);

  // Check if app is ready (fonts loaded AND auth checked)
  useEffect(() => {
    if (fontsLoaded && isAuthChecked) {
      setIsAppReady(true);
    }
  }, [fontsLoaded, isAuthChecked]);

  // Hide splash screen when app is ready
  useEffect(() => {
    const hideSplash = async () => {
      if (isAppReady && navigationState?.key) {
        // Small delay to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 50));
        await SplashScreen.hideAsync();
      }
    };
    
    hideSplash();
  }, [isAppReady, navigationState?.key]);

  // Handle navigation based on auth state
  useEffect(() => {
    // Only navigate when router is ready AND app is ready AND splash is hidden
    if (!navigationState?.key || !isAppReady) return;

    const inAuthScreen = segments[0] === "(auth)";
    const isSignedIn = user && token;

    if (!isSignedIn && !inAuthScreen) {
      router.replace("/(auth)");
    } else if (isSignedIn && inAuthScreen) {
      router.replace("/(tabs)");
    }
  }, [user, token, segments, navigationState?.key, isAppReady]);

  // Don't render anything until fonts are loaded
  // This prevents flash of unstyled text
  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeScreen>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(auth)" />
        </Stack>
      </SafeScreen>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}