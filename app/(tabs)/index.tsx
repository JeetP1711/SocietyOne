import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import Colors from "@/constants/colors";

function StatCard({ label, value, icon, color, bg }: { label: string; value: string | number; icon: any; color: string; bg: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ label, icon, color, bg, onPress, badge }: { label: string; icon: any; color: string; bg: string; onPress: () => void; badge?: number }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickAction, { opacity: pressed ? 0.8 : 1 }]}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <MaterialCommunityIcons name={icon} size={26} color={color} />
        {!!badge && badge > 0 && (
          <View style={styles.badgeDot}>
            <Text style={styles.badgeDotText}>{badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { announcements, maintenance, complaints, meetings, festivals, societies, visitorRequests } = useData();

  const isAdmin = user?.role === "admin";
  const isSecretary = user?.role === "secretary";
  const isStaff = isAdmin || isSecretary;

  const today = new Date().toISOString().split("T")[0];

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const getRoleLabel = () => {
    if (isAdmin) return "Platform Administrator";
    if (isSecretary) return "Society Secretary";
    return `Flat ${user?.flatNumber}`;
  };

  if (isAdmin) {
    return <AdminDashboard topPadding={topPadding} />;
  }

  const pendingMaintenance = maintenance.filter((m) => m.status !== "paid").length;
  const openComplaints = complaints.filter((c) => c.status === "open" || c.status === "in-progress").length;
  const upcomingMeetings = meetings.filter((m) => m.date >= today).length;
  const activeFestivals = festivals.filter((f) => f.status === "active").length;
  const recentAnnouncements = announcements.slice(0, 3);
  const pendingVisitors = isStaff
    ? visitorRequests.filter((v) => v.status === "pending").length
    : visitorRequests.filter((v) => v.flatNumber === user?.flatNumber && v.status === "pending").length;

  const getPriorityColor = (p: string) => {
    if (p === "urgent") return Colors.error;
    if (p === "high") return Colors.warning;
    if (p === "medium") return Colors.secondary;
    return Colors.primary;
  };

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#0F4C2E", "#16A34A"]}
        style={[styles.headerGradient, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Good {getGreeting()},</Text>
            <Text style={styles.userName}>{user?.name}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{getRoleLabel()}</Text>
            </View>
          </View>
          <View style={styles.headerAvatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "U"}</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Pending Fees" value={pendingMaintenance} icon="receipt-outline" color="#F59E0B" bg="#fff" />
          <StatCard label="Open Issues" value={openComplaints} icon="warning-outline" color={Colors.error} bg="#fff" />
          <StatCard label="Meetings" value={upcomingMeetings} icon="calendar-outline" color={Colors.secondary} bg="#fff" />
          <StatCard label="Festivals" value={activeFestivals} icon="sparkles-outline" color={Colors.primary} bg="#fff" />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction label="Maintenance" icon="cash-multiple" color="#16A34A" bg="#F0FDF4" onPress={() => router.push("/maintenance")} />
          <QuickAction label="Meetings" icon="calendar-check" color="#2563EB" bg="#EFF6FF" onPress={() => router.push("/meetings")} />
          <QuickAction label="Gate Pass" icon="qrcode-scan" color="#7C3AED" bg="#F5F3FF" onPress={() => router.push("/gatepass")} />
          <QuickAction label="Complaints" icon="alert-circle-outline" color="#DC2626" bg="#FEF2F2" onPress={() => router.push("/complaints")} />
          <QuickAction label="Bookings" icon="bookmark-multiple" color="#0891B2" bg="#ECFEFF" onPress={() => router.push("/bookings")} />
          <QuickAction label="Festivals" icon="party-popper" color="#D97706" bg="#FFFBEB" onPress={() => router.push("/festivals")} />
          {isSecretary && (
            <QuickAction label="Register Society" icon="office-building-plus" color="#059669" bg="#ECFDF5" onPress={() => router.push("/society-register")} />
          )}
          {isSecretary && (
            <QuickAction label="Members" icon="account-group" color="#7C3AED" bg="#F5F3FF" onPress={() => router.push("/members")} />
          )}
          <QuickAction label="NOC" icon="file-certificate" color="#64748B" bg="#F8FAFC" onPress={() => router.push("/noc")} />
          <QuickAction label="Visitors" icon="account-clock" color="#0891B2" bg="#ECFEFF" onPress={() => router.push("/visitors")} badge={pendingVisitors > 0 ? pendingVisitors : undefined} />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Announcements</Text>
          <Pressable onPress={() => router.push("/(tabs)/notices")}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>

        {recentAnnouncements.map((a) => (
          <View key={a.id} style={styles.announcementCard}>
            <View style={[styles.announcementPriority, { backgroundColor: getPriorityColor(a.priority) }]} />
            <View style={styles.announcementBody}>
              <View style={styles.announcementMeta}>
                <View style={[styles.categoryBadge, { backgroundColor: getPriorityColor(a.priority) + "20" }]}>
                  <Text style={[styles.categoryText, { color: getPriorityColor(a.priority) }]}>
                    {a.priority.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.announcementDate}>{formatDate(a.createdAt)}</Text>
              </View>
              <Text style={styles.announcementTitle} numberOfLines={1}>{a.title}</Text>
              <Text style={styles.announcementContent} numberOfLines={2}>{a.content}</Text>
            </View>
          </View>
        ))}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

function AdminDashboard({ topPadding }: { topPadding: number }) {
  const { societies, complaints, maintenance, meetings, visitorRequests } = useData();

  const totalSocieties = societies.length;
  const approvedSocieties = societies.filter((s) => s.status === "approved");
  const pendingSocieties = societies.filter((s) => s.status === "pending");
  const rejectedCount = societies.filter((s) => s.status === "rejected").length;
  const totalFlats = approvedSocieties.reduce((sum, s) => sum + s.totalFlats, 0);
  const totalStates = new Set(approvedSocieties.map((s) => s.state)).size;
  const openComplaints = complaints.filter((c) => c.status === "open" || c.status === "in-progress").length;
  const today = new Date().toISOString().split("T")[0];
  const upcomingMeetings = meetings.filter((m) => m.date >= today).length;
  const pendingVisitors = visitorRequests.filter((v) => v.status === "pending").length;

  const recentApplications = [...societies]
    .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
    .slice(0, 4);

  return (
    <ScrollView
      style={styles.container}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={["#0F172A", "#1E3A8A"]}
        style={[styles.headerGradient, { paddingTop: topPadding + 16 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Platform Dashboard</Text>
            <Text style={styles.userName}>SocietyOne Admin</Text>
            <View style={[styles.roleBadge, { backgroundColor: "rgba(96,165,250,0.25)" }]}>
              <MaterialCommunityIcons name="shield-crown" size={12} color="#93C5FD" />
              <Text style={[styles.roleText, { color: "#93C5FD", marginLeft: 4 }]}>Platform Administrator</Text>
            </View>
          </View>
          <View style={[styles.headerAvatar, { backgroundColor: "rgba(96,165,250,0.2)", borderColor: "rgba(96,165,250,0.4)" }]}>
            <MaterialCommunityIcons name="shield-crown" size={26} color="#93C5FD" />
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Registered" value={totalSocieties} icon="business-outline" color="#60A5FA" bg="#fff" />
          <StatCard label="Approved" value={approvedSocieties.length} icon="checkmark-circle-outline" color={Colors.success} bg="#fff" />
          <StatCard label="Pending" value={pendingSocieties.length} icon="time-outline" color="#D97706" bg="#fff" />
          <StatCard label="Total Flats" value={totalFlats} icon="home-outline" color="#7C3AED" bg="#fff" />
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {pendingSocieties.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.pendingBanner, { opacity: pressed ? 0.9 : 1 }]}
            onPress={() => router.push("/societies")}
          >
            <View style={styles.pendingBannerIcon}>
              <Ionicons name="alert-circle" size={24} color={Colors.warning} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pendingBannerTitle}>
                {pendingSocieties.length} Societ{pendingSocieties.length > 1 ? "ies" : "y"} Awaiting Approval
              </Text>
              <Text style={styles.pendingBannerSub}>Tap to review and take action</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.warning} />
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <QuickAction
            label="Societies"
            icon="office-building"
            color="#2563EB"
            bg="#EFF6FF"
            onPress={() => router.push("/societies")}
            badge={pendingSocieties.length}
          />
          <QuickAction label="Maintenance" icon="cash-multiple" color="#16A34A" bg="#F0FDF4" onPress={() => router.push("/maintenance")} />
          <QuickAction label="Complaints" icon="alert-circle-outline" color="#DC2626" bg="#FEF2F2" onPress={() => router.push("/complaints")} badge={openComplaints > 0 ? openComplaints : undefined} />
          <QuickAction label="Members" icon="account-group" color="#059669" bg="#ECFDF5" onPress={() => router.push("/members")} />
          <QuickAction label="Meetings" icon="calendar-check" color="#0891B2" bg="#ECFEFF" onPress={() => router.push("/meetings")} />
          <QuickAction label="NOC" icon="file-certificate" color="#64748B" bg="#F8FAFC" onPress={() => router.push("/noc")} />
          <QuickAction label="Gate Pass" icon="qrcode-scan" color="#7C3AED" bg="#F5F3FF" onPress={() => router.push("/gatepass")} />
          <QuickAction label="Visitors" icon="account-clock" color="#0891B2" bg="#ECFEFF" onPress={() => router.push("/visitors")} badge={pendingVisitors > 0 ? pendingVisitors : undefined} />
        </View>

        <View style={styles.adminStatsSection}>
          <Text style={styles.sectionTitle}>Platform Overview</Text>
          <View style={styles.overviewGrid}>
            <OverviewCard label="States Covered" value={totalStates} icon="map-outline" color="#7C3AED" />
            <OverviewCard label="Active Societies" value={approvedSocieties.length} icon="checkmark-circle-outline" color={Colors.success} />
            <OverviewCard label="Rejected" value={rejectedCount} icon="close-circle-outline" color={Colors.error} />
            <OverviewCard label="Open Complaints" value={openComplaints} icon="warning-outline" color={Colors.warning} />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Applications</Text>
          <Pressable onPress={() => router.push("/societies")}>
            <Text style={styles.seeAll}>View All</Text>
          </Pressable>
        </View>

        {recentApplications.map((s) => {
          const statusColor = s.status === "approved" ? Colors.success : s.status === "rejected" ? Colors.error : Colors.warning;
          const statusBg = s.status === "approved" ? Colors.successSoft : s.status === "rejected" ? Colors.errorSoft : Colors.warningSoft;
          return (
            <Pressable
              key={s.id}
              style={({ pressed }) => [styles.recentAppCard, { opacity: pressed ? 0.92 : 1 }]}
              onPress={() => router.push("/societies")}
            >
              <View style={[styles.recentAppIcon, { backgroundColor: statusColor + "15" }]}>
                <MaterialCommunityIcons name="office-building" size={22} color={statusColor} />
              </View>
              <View style={styles.recentAppInfo}>
                <Text style={styles.recentAppName} numberOfLines={1}>{s.name}</Text>
                <Text style={styles.recentAppMeta}>{s.city}, {s.state} · {s.totalFlats} Flats</Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                  <Text style={[styles.statusText, { color: statusColor }]}>{s.status}</Text>
                </View>
                <Text style={styles.recentAppDate}>{s.appliedDate}</Text>
              </View>
            </Pressable>
          );
        })}

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

function OverviewCard({ label, value, icon, color }: { label: string; value: number; icon: any; color: string }) {
  return (
    <View style={[styles.overviewCard, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.overviewValue, { color }]}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  greeting: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
  },
  userName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#fff",
  },
  headerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  avatarText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    gap: 4,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  body: {
    padding: 20,
  },
  pendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.warningSoft,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: "#FDE68A",
  },
  pendingBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  pendingBannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.warning,
    marginBottom: 2,
  },
  pendingBannerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#92400E",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 14,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  quickAction: {
    width: "22%",
    alignItems: "center",
    gap: 8,
  },
  quickActionIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  badgeDot: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeDotText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  adminStatsSection: {
    marginBottom: 24,
  },
  overviewGrid: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  overviewCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    gap: 6,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  overviewValue: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  overviewLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  recentAppCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentAppIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  recentAppInfo: {
    flex: 1,
    gap: 3,
  },
  recentAppName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  recentAppMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  recentAppDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  announcementCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  announcementPriority: {
    width: 4,
  },
  announcementBody: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  announcementMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  announcementDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  announcementTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginTop: 2,
  },
  announcementContent: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
