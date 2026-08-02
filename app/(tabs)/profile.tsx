import React from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import Colors from "@/constants/colors";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { maintenance, complaints, gatePasses, bookings } = useData();

  const myMaintenance = user?.flatNumber
    ? maintenance.filter((m) => m.flatNumber === user.flatNumber)
    : maintenance;
  const myComplaints = user?.flatNumber
    ? complaints.filter((c) => c.flatNumber === user.flatNumber)
    : complaints;
  const myGatePasses = user?.flatNumber
    ? gatePasses.filter((g) => g.flatNumber === user.flatNumber)
    : gatePasses;
  const myBookings = user?.flatNumber
    ? bookings.filter((b) => b.flatNumber === user.flatNumber)
    : bookings;

  const paidCount = myMaintenance.filter((m) => m.status === "paid").length;
  const pendingCount = myMaintenance.filter((m) => m.status !== "paid").length;

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  async function handleLogout() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace("/select-location");
  }

  const roleColor = user?.role === "admin" ? "#DC2626" : user?.role === "secretary" ? "#2563EB" : "#16A34A";
  const roleLabel = user?.role === "admin" ? "Administrator" : user?.role === "secretary" ? "Secretary" : "Member";

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
      <LinearGradient
        colors={[roleColor, roleColor + "99"]}
        style={[styles.header, { paddingTop: topPadding + 20 }]}
      >
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "U"}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
        {user?.flatNumber && (
          <View style={styles.flatBadge}>
            <Ionicons name="home" size={14} color="#fff" />
            <Text style={styles.flatText}>Flat {user.flatNumber}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.infoCard}>
          <InfoRow icon="person-outline" label="Full Name" value={user?.name ?? "-"} />
          <Divider />
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? "-"} />
          <Divider />
          <InfoRow icon="call-outline" label="Phone" value={user?.phone ?? "-"} />
          {user?.flatNumber && (
            <>
              <Divider />
              <InfoRow icon="home-outline" label="Flat Number" value={user.flatNumber} />
            </>
          )}
        </View>

        {user?.role === "member" && (
          <>
            <Text style={styles.sectionTitle}>My Activity</Text>
            <View style={styles.statsRow}>
              <StatBox label="Fees Paid" value={paidCount} color={Colors.primary} icon="checkmark-circle" />
              <StatBox label="Pending" value={pendingCount} color={Colors.warning} icon="time" />
              <StatBox label="Complaints" value={myComplaints.length} color={Colors.error} icon="warning" />
              <StatBox label="Gate Passes" value={myGatePasses.length} color={Colors.secondary} icon="qr-code" />
            </View>
          </>
        )}

        {(user?.role === "admin" || user?.role === "secretary") && (
          <>
            <Text style={styles.sectionTitle}>Society Overview</Text>
            <View style={styles.statsRow}>
              <StatBox label="Total Fees" value={maintenance.length} color={Colors.primary} icon="cash" />
              <StatBox label="Pending" value={maintenance.filter((m) => m.status !== "paid").length} color={Colors.warning} icon="time" />
              <StatBox label="Complaints" value={complaints.length} color={Colors.error} icon="warning" />
              <StatBox label="Gate Passes" value={gatePasses.length} color={Colors.secondary} icon="qr-code" />
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Quick Links</Text>
        <View style={styles.menuList}>
          <MenuRow icon="receipt-outline" label="My Maintenance" onPress={() => router.push("/maintenance")} />
          <MenuRow icon="warning-outline" label="My Complaints" onPress={() => router.push("/complaints")} />
          <MenuRow icon="bookmark-outline" label="My Bookings" onPress={() => router.push("/bookings")} />
          <MenuRow icon="qr-code-outline" label="Gate Passes" onPress={() => router.push("/gatepass")} />
          {user?.role !== "admin" && (
            <MenuRow icon="document-text-outline" label="NOC Requests" onPress={() => router.push("/noc")} />
          )}
        </View>

        <View style={styles.societyCard}>
          <View style={styles.societyInfo}>
            <MaterialCommunityIcons name="office-building" size={28} color={Colors.primary} />
            <View>
              <Text style={styles.societyName}>Green Valley CHS</Text>
              <Text style={styles.societyAddr}>Plot 42, Sector 21, Mumbai — 400 001</Text>
            </View>
          </View>
          <View style={styles.societyContact}>
            <Ionicons name="call-outline" size={14} color={Colors.textSecondary} />
            <Text style={styles.societyContactText}>+91 22 1234 5678</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function StatBox({ label, value, color, icon }: { label: string; value: number; color: string; icon: any }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.menuRow, { opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
    >
      <View style={styles.menuIconWrap}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 32, alignItems: "center", gap: 8 },
  avatarWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.3)", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#fff", marginBottom: 4 },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  roleBadge: { backgroundColor: "rgba(255,255,255,0.25)", paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20 },
  roleText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  flatBadge: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  flatText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#fff" },
  body: { padding: 16 },
  infoCard: { backgroundColor: Colors.card, borderRadius: 18, padding: 4, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 14 },
  infoIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: "center", justifyContent: "center" },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  infoValue: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.divider, marginHorizontal: 14 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 12, marginTop: 4 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 12, alignItems: "center", gap: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: Colors.textSecondary, textAlign: "center" },
  menuList: { backgroundColor: Colors.card, borderRadius: 18, overflow: "hidden", marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  menuRow: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14, borderBottomWidth: 1, borderBottomColor: Colors.divider },
  menuIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primarySoft, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.text },
  societyCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, gap: 10, marginBottom: 20, borderWidth: 1, borderColor: Colors.primaryBorder, shadowColor: Colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  societyInfo: { flexDirection: "row", gap: 12, alignItems: "center" },
  societyName: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  societyAddr: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginTop: 2 },
  societyContact: { flexDirection: "row", gap: 6, alignItems: "center" },
  societyContactText: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.errorSoft, borderRadius: 14, paddingVertical: 16, borderWidth: 1, borderColor: "#FECACA" },
  logoutText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.error },
});
