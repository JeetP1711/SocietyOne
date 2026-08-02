import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData, FestivalFund } from "@/context/DataContext";
import Colors from "@/constants/colors";

export default function FestivalsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { festivals, addFestival, addFestivalContribution } = useData();
  const [selectedFestival, setSelectedFestival] = useState<FestivalFund | null>(null);
  const [showAddFestival, setShowAddFestival] = useState(false);

  const canManage = user?.role === "admin" || user?.role === "secretary";
  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={["#92400E", "#D97706"]} style={[styles.header, { paddingTop: topPadding + 8 }]}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>Festival Funds</Text>
          {canManage ? (
            <Pressable style={styles.addBtn} onPress={() => setShowAddFestival(true)}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>
      </LinearGradient>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
      >
        {festivals.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="party-popper" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>No active fund drives</Text>
          </View>
        )}
        {festivals.map((f) => (
          <FestivalCard
            key={f.id}
            item={f}
            user={user}
            onContribute={() => setSelectedFestival(f)}
          />
        ))}
      </ScrollView>

      {selectedFestival && (
        <ContributeModal
          festival={selectedFestival}
          user={user}
          onClose={() => setSelectedFestival(null)}
          onContribute={async (amount) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addFestivalContribution(selectedFestival.id, {
              flatNumber: user?.flatNumber ?? "Admin",
              residentName: user?.name ?? "Admin",
              amount,
            });
            setSelectedFestival(null);
          }}
        />
      )}

      {showAddFestival && (
        <AddFestivalModal
          user={user}
          onClose={() => setShowAddFestival(false)}
          onAdd={async (data) => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await addFestival({ ...data, createdBy: user?.name ?? "Admin", status: "active" });
            setShowAddFestival(false);
          }}
        />
      )}
    </View>
  );
}

function FestivalCard({ item, user, onContribute }: { item: FestivalFund; user: any; onContribute: () => void }) {
  const progress = item.targetAmount > 0 ? item.collectedAmount / item.targetAmount : 0;
  const remaining = item.targetAmount - item.collectedAmount;
  const myContribution = user?.flatNumber
    ? item.contributions.find((c) => c.flatNumber === user.flatNumber)
    : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.festivalIcon}>
          <MaterialCommunityIcons name="party-popper" size={28} color="#D97706" />
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: item.status === "active" ? Colors.successSoft : Colors.divider }]}>
              <Text style={[styles.statusText, { color: item.status === "active" ? Colors.success : Colors.textSecondary }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Collection Progress</Text>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
        </View>
        <View style={styles.amountRow}>
          <View>
            <Text style={styles.amountLabel}>Collected</Text>
            <Text style={styles.amountValue}>₹{item.collectedAmount.toLocaleString()}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amountLabel}>Target</Text>
            <Text style={[styles.amountValue, { color: Colors.text }]}>₹{item.targetAmount.toLocaleString()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>Due: {item.dueDate}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={14} color={Colors.textSecondary} />
          <Text style={styles.metaText}>{item.contributions.length} contributors</Text>
        </View>
      </View>

      {myContribution && (
        <View style={styles.myContribution}>
          <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
          <Text style={styles.myContributionText}>Your contribution: ₹{myContribution.amount.toLocaleString()}</Text>
        </View>
      )}

      {item.status === "active" && !myContribution && user?.flatNumber && (
        <Pressable
          style={({ pressed }) => [styles.contributeBtn, { opacity: pressed ? 0.8 : 1 }]}
          onPress={onContribute}
        >
          <Ionicons name="heart" size={16} color="#fff" />
          <Text style={styles.contributeBtnText}>Contribute</Text>
        </Pressable>
      )}

      {item.contributions.length > 0 && (
        <View style={styles.contributorsList}>
          <Text style={styles.contributorsTitle}>Recent Contributors</Text>
          {item.contributions.slice(0, 3).map((c) => (
            <View key={c.id} style={styles.contributorRow}>
              <View style={styles.contributorAvatar}>
                <Text style={styles.contributorAvatarText}>{c.residentName.charAt(0)}</Text>
              </View>
              <View style={styles.contributorInfo}>
                <Text style={styles.contributorName}>{c.residentName}</Text>
                <Text style={styles.contributorFlat}>{c.flatNumber}</Text>
              </View>
              <Text style={styles.contributorAmount}>₹{c.amount.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ContributeModal({ festival, user, onClose, onContribute }: any) {
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState("");
  const QUICK_AMOUNTS = [500, 1000, 1500, 2000, 2500];

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.modalHandle} />
        <Text style={styles.modalTitle}>Contribute to Fund</Text>
        <Text style={styles.modalSubtitle}>{festival.title}</Text>
        <Text style={styles.formLabel}>Quick Amount</Text>
        <View style={styles.quickAmountsRow}>
          {QUICK_AMOUNTS.map((a) => (
            <Pressable
              key={a}
              style={[styles.quickAmountBtn, amount === String(a) && styles.quickAmountBtnActive]}
              onPress={() => setAmount(String(a))}
            >
              <Text style={[styles.quickAmountText, amount === String(a) && { color: "#fff" }]}>₹{a}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={[styles.formLabel, { marginTop: 16 }]}>Custom Amount</Text>
        <TextInput
          style={styles.formInput}
          placeholder="Enter amount"
          placeholderTextColor={Colors.textTertiary}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />
        <Pressable
          style={({ pressed }) => [styles.contributeSubmitBtn, { opacity: pressed ? 0.8 : 1, marginTop: 24 }]}
          onPress={() => {
            const a = parseInt(amount);
            if (a > 0) onContribute(a);
          }}
        >
          <Text style={styles.contributeBtnText}>Confirm Contribution</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

function AddFestivalModal({ user, onClose, onAdd }: any) {
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [dueDate, setDueDate] = useState("");

  return (
    <Modal visible animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.modalContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Create Fund Drive</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ gap: 14 }}>
              <View>
                <Text style={styles.formLabel}>Event Name</Text>
                <TextInput style={styles.formInput} placeholder="e.g. Diwali Celebration 2026" placeholderTextColor={Colors.textTertiary} value={title} onChangeText={setTitle} />
              </View>
              <View>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput style={[styles.formInput, { height: 80, textAlignVertical: "top" }]} placeholder="Describe the event..." placeholderTextColor={Colors.textTertiary} value={description} onChangeText={setDescription} multiline />
              </View>
              <View>
                <Text style={styles.formLabel}>Target Amount (₹)</Text>
                <TextInput style={styles.formInput} placeholder="25000" placeholderTextColor={Colors.textTertiary} value={target} onChangeText={setTarget} keyboardType="numeric" />
              </View>
              <View>
                <Text style={styles.formLabel}>Due Date (YYYY-MM-DD)</Text>
                <TextInput style={styles.formInput} placeholder="2026-10-20" placeholderTextColor={Colors.textTertiary} value={dueDate} onChangeText={setDueDate} />
              </View>
            </View>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.contributeSubmitBtn, { opacity: pressed ? 0.8 : 1, marginTop: 16 }]}
            onPress={() => { if (title && target) onAdd({ title, description, targetAmount: parseInt(target), dueDate }); }}
          >
            <Text style={styles.contributeBtnText}>Create Fund Drive</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  addBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  card: { backgroundColor: Colors.card, borderRadius: 18, marginBottom: 16, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  cardHeader: { flexDirection: "row", gap: 12, marginBottom: 14 },
  festivalIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#FFFBEB", alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1, gap: 4 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.text },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textSecondary, lineHeight: 18 },
  progressSection: { marginBottom: 14 },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  progressLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  progressPct: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#D97706" },
  progressBar: { height: 8, backgroundColor: "#FEF3C7", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#D97706", borderRadius: 4 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  amountLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  amountValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#D97706" },
  cardMeta: { flexDirection: "row", gap: 16, marginBottom: 14 },
  metaItem: { flexDirection: "row", gap: 6, alignItems: "center" },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  myContribution: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: Colors.successSoft, padding: 10, borderRadius: 10, marginBottom: 12 },
  myContributionText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.success },
  contributeBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#D97706", borderRadius: 12, paddingVertical: 12, marginBottom: 12 },
  contributeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  contributorsList: { borderTopWidth: 1, borderTopColor: Colors.divider, paddingTop: 14 },
  contributorsTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary, marginBottom: 10 },
  contributorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  contributorAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FEF3C7", alignItems: "center", justifyContent: "center" },
  contributorAvatarText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#D97706" },
  contributorInfo: { flex: 1 },
  contributorName: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.text },
  contributorFlat: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textSecondary },
  contributorAmount: { fontSize: 14, fontFamily: "Inter_700Bold", color: Colors.text },
  modalContainer: { flex: 1, backgroundColor: Colors.card, padding: 24 },
  modalHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.text, marginBottom: 4 },
  modalSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary, marginBottom: 20 },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 8 },
  formInput: { backgroundColor: Colors.background, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  quickAmountsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  quickAmountBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background },
  quickAmountBtnActive: { backgroundColor: "#D97706", borderColor: "#D97706" },
  quickAmountText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
  contributeSubmitBtn: { backgroundColor: "#D97706", borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  cancelBtn: { backgroundColor: Colors.background, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1.5, borderColor: Colors.border, marginTop: 10 },
  cancelBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textSecondary },
});
