import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider } from "@/context/DataContext";
import { requestNotificationPermissions } from "@/lib/notifications";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="maintenance/index" options={{ headerShown: false }} />
      <Stack.Screen name="festivals/index" options={{ headerShown: false }} />
      <Stack.Screen name="meetings/index" options={{ headerShown: false }} />
      <Stack.Screen name="bookings/index" options={{ headerShown: false }} />
      <Stack.Screen name="gatepass/index" options={{ headerShown: false }} />
      <Stack.Screen name="members/index" options={{ headerShown: false }} />
      <Stack.Screen name="complaints/index" options={{ headerShown: false }} />
      <Stack.Screen name="noc/index" options={{ headerShown: false }} />
      <Stack.Screen name="select-location" options={{ headerShown: false }} />
      <Stack.Screen name="societies/index" options={{ headerShown: false }} />
      <Stack.Screen name="society-register/index" options={{ headerShown: false }} />
      <Stack.Screen name="visitors/index" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
      requestNotificationPermissions();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </DataProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
