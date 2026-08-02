import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "@/context/AuthContext";
import { useData, Member, Worker } from "@/context/DataContext";
import Colors from "@/constants/colors";

type Tab = "residents" | "workers";

const AVATAR_COLORS = ["#16A34A", "#2563EB", "#DC2626", "#D97706", "#7C3AED", "#0891B2", "#059669", "#DB2777"];

export default function MembersScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { members, workers } = useData();
  const [activeTab, setActiveTab] = useState<Tab>("residents");
  const [search, setSearch] = useState("");

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.flatNumber.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search)
  );

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase())
  );

  const totalFlats = members.length;
  const owners = members.filter((m) => m.type === "owner").length;
  const tenants = members.filter((m) => m.type === "tenant").length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#065F46", "#059669"]} style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Directory</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.summaryRow}>
          <SummaryChip label="Total Flats" value={totalFlats} color="#fff" />
          <SummaryChip label="Owners" value={owners} color="#A7F3D0" />
          <SummaryChip label="Tenants" value={tenants} color="#FCD34D" />
          <SummaryChip label="Staff" value={workers.filter((w) => w.isActive).length} color="#A5B4FC" />
        </View>
        <View style={styles.tabRow}>
          <Pressable style={[styles.tabBtn, activeTab === "residents" && styles.tabBtnActive]} onPress={() => setActiveTab("residents")}>
            <Text style={[styles.tabBtnText, activeTab === "residents" && styles.tabBtnTextActive]}>Residents</Text>
          </Pressable>
          <Pressable style={[styles.tabBtn, activeTab === "workers" && styles.tabBtnActive]} onPress={() => setActiveTab("workers")}>
            <Text style={[styles.tabBtnText, activeTab === "workers" && styles.tabBtnTextActive]}>Workers</Text>
          </Pressable>
        </View>
      </LinearGradient>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === "residents" ? "Search by name, flat or phone..." : "Search by name or role..."}
          placeholderTextColor={Colors.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
      >
        {activeTab === "residents"
          ? filteredMembers.map((m, i) => <MemberCard key={m.id} item={m} index={i} />)
          : filteredWorkers.map((w, i) => <WorkerCard key={w.id} item={w} index={i} />)}
        {activeTab === "residents" && filteredMembers.length === 0 && (
          <EmptyState text="No residents found" />
        )}
        {activeTab === "workers" && filteredWorkers.length === 0 && (
          <EmptyState text="No workers found" />
        )}
      </ScrollView>
    </View>
  );
}

function SummaryChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.summaryChip}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

function MemberCard({ item, index }: { item: Member; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <Pressable style={styles.card} onPress={() => setExpanded(!expanded)}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: item.type === "owner" ? Colors.primarySoft : Colors.warningSoft }]}>
              <Text style={[styles.typeText, { color: item.type === "owner" ? Colors.primary : Colors.warning }]}>
                {item.type}
              </Text>
            </View>
          </View>
          <View style={styles.flatRow}>
            <Ionicons name="home" size={13} color={Colors.primary} />
            <Text style={styles.flatText}>{item.flatNumber}</Text>
          </View>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </View>
        </View>
        <View style={styles.familyBadge}>
          <Ionicons name="people" size={14} color={Colors.secondary} />
          <Text style={styles.familyText}>{item.familySize}</Text>
        </View>
      </View>
      {expanded && (
        <View style={styles.expandedContent}>
          <View style={styles.expandedDivider} />
          <View style={styles.expandedRow}>
            <View style={styles.expandedItem}>
              <Text style={styles.expandedLabel}>Email</Text>
              <Text style={styles.expandedValue}>{item.email}</Text>
            </View>
            <View style={styles.expandedItem}>
              <Text style={styles.expandedLabel}>Move-in Date</Text>
              <Text style={styles.expandedValue}>{item.moveInDate}</Text>
            </View>
          </View>
          {item.vehicles.length > 0 && (
            <View>
              <Text style={styles.expandedLabel}>Vehicles</Text>
              <View style={styles.vehicleRow}>
                {item.vehicles.map((v, i) => (
                  <View key={i} style={styles.vehicleChip}>
                    <MaterialCommunityIcons name="car" size={12} color={Colors.secondary} />
                    <Text style={styles.vehicleText}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
}

function WorkerCard({ item, index }: { item: Worker; index: number }) {
  const avatarColor = AVATAR_COLORS[(index + 3) % AVATAR_COLORS.length];

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{item.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: Colors.secondarySoft }]}>
              <Text style={[styles.typeText, { color: Colors.secondary }]}>{item.role}</Text>
            </View>
          </View>
          <View style={styles.phoneRow}>
            <Ionicons name="call-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.phoneText}>{item.phone}</Text>
          </View>
          <View style={styles.phoneRow}>
            <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.phoneText}>{item.shift}</Text>
          </View>
        </View>
        <View style={[styles.activeBadge, { backgroundColor: item.isActive ? Colors.successSoft : Colors.errorSoft }]}>
          <View style={[styles.activeDot, { backgroundColor: item.isActive ? Colors.success : Colors.error }]} />
          <Text style={[styles.activeText, { color: item.isActive ? Colors.success : Colors.error }]}>
            {item.isActive ? "Active" : "Inactive"}
          </Text>
        </View>
      </View>
    </View>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={48} color={Colors.textLight} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  summaryRow: { flexDirection: "row", gap: 12, justifyContent: "space-around", marginBottom: 14 },
  summaryChip: { alignItems: "center" },
  summaryValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  summaryLabel: { fontSize: 10, fontFamily: "Inter_500Medium", opacity: 0.9 },
  tabRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 3 },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: "center", borderRadius: 10 },
  tabBtnActive: { backgroundColor: "#fff" },
  tabBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)" },
  tabBtnTextActive: { color: "#065F46", fontFamily: "Inter_600SemiBold" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, margin: 16, marginBottom: 8, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, gap: 10, borderWidth: 1.5, borderColor: Colors.border },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  card: { backgroundColor: Colors.card, borderRadius: 16, marginBottom: 10, padding: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardName: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.text, flex: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  flatRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  flatText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  phoneRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  phoneText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  familyBadge: { flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: Colors.secondarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  familyText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.secondary },
  activeBadge: { flexDirection: "row", gap: 5, alignItems: "center", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  expandedContent: { marginTop: 12, gap: 10 },
  expandedDivider: { height: 1, backgroundColor: Colors.divider },
  expandedRow: { flexDirection: "row", gap: 12 },
  expandedItem: { flex: 1 },
  expandedLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  expandedValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginTop: 2 },
  vehicleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  vehicleChip: { flexDirection: "row", gap: 6, alignItems: "center", backgroundColor: Colors.secondarySoft, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  vehicleText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.secondary },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
});
