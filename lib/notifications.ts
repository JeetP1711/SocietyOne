import { Platform } from "react-native";

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const Notifications = await import("expo-notifications");
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

export async function sendNotification(title: string, body: string, data?: Record<string, unknown>): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: null,
    });
  } catch (e) {
    console.log("Notification error:", e);
  }
}

export async function scheduleNotification(
  title: string,
  body: string,
  delaySeconds: number,
  data?: Record<string, unknown>
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data: data ?? {}, sound: true },
      trigger: { seconds: delaySeconds, type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL },
    });
  } catch (e) {
    console.log("Scheduled notification error:", e);
  }
}
