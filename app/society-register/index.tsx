import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";
import { useData } from "@/context/DataContext";
import Colors from "@/constants/colors";

export default function SocietyRegisterScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addSocietyRegistration, societies } = useData();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    totalFlats: "",
    wings: "",
    secretaryName: user?.name ?? "",
    secretaryPhone: user?.phone ?? "",
    secretaryEmail: user?.email ?? "",
    registrationNumber: "",
    establishedYear: "",
    notes: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const myApplications = societies.filter(
    (s) => s.secretaryEmail === user?.email || s.secretaryName === user?.name
  );

  const topPadding = insets.top + (Platform.OS === "web" ? 67 : 0);

  async function handleSubmit() {
    const required = ["name", "address", "city", "state", "pincode", "totalFlats", "secretaryName", "secretaryPhone", "registrationNumber", "establishedYear"];
    const missing = required.filter((f) => !form[f as keyof typeof form]?.toString().trim());
    if (missing.length > 0) {
      Alert.alert("Missing Fields", "Please fill all required fields before submitting.");
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addSocietyRegistration({
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
      totalFlats: parseInt(form.totalFlats) || 0,
      wings: form.wings || "A",
      secretaryName: form.secretaryName,
      secretaryPhone: form.secretaryPhone,
      secretaryEmail: form.secretaryEmail,
      registrationNumber: form.registrationNumber,
      establishedYear: parseInt(form.establishedYear) || new Date().getFullYear(),
      notes: form.notes,
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <View style={[styles.successContainer, { paddingTop: topPadding }]}>
        <LinearGradient colors={["#0F4C2E", "#16A34A"]} style={styles.successGradient}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={72} color="#fff" />
          </View>
          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your society registration request has been submitted successfully and is under review.
          </Text>
          <View style={styles.successInfo}>
            <View style={styles.successInfoRow}>
              <Ionicons name="time-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.successInfoText}>Review typically takes 3–5 working days</Text>
            </View>
            <View style={styles.successInfoRow}>
              <Ionicons name="mail-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.successInfoText}>You'll be notified at {form.secretaryEmail}</Text>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.successBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.successBtnText}>Back to Home</Text>
          </Pressable>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.container}>
        <LinearGradient
          colors={["#0F4C2E", "#16A34A"]}
          style={[styles.header, { paddingTop: topPadding + 8 }]}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </Pressable>
            <Text style={styles.headerTitle}>Register Society</Text>
            <View style={{ width: 36 }} />
          </View>
          <Text style={styles.headerSubtitle}>
            Submit your society details for platform registration
          </Text>
        </LinearGradient>

        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        >
          {myApplications.length > 0 && (
            <View style={styles.existingApplications}>
              <View style={styles.existingHeader}>
                <Ionicons name="document-text-outline" size={16} color={Colors.secondary} />
                <Text style={styles.existingTitle}>Your Previous Applications</Text>
              </View>
              {myApplications.map((s) => (
                <View key={s.id} style={styles.existingItem}>
                  <MaterialCommunityIcons name="office-building" size={16} color={Colors.secondary} />
                  <Text style={styles.existingName}>{s.name}</Text>
                  <View style={[styles.existingStatus, { backgroundColor: getStatusBg(s.status) }]}>
                    <Text style={[styles.existingStatusText, { color: getStatusColor(s.status) }]}>{s.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <SectionHeader icon="office-building" title="Society Information" />

          <FormField label="Society Name *" placeholder="e.g. Green Valley CHS" value={form.name} onChange={(v) => update("name", v)} />
          <FormField label="Legal Registration Number *" placeholder="e.g. MH-CHS-2026-01234" value={form.registrationNumber} onChange={(v) => update("registrationNumber", v)} />
          <FormField label="Year of Establishment *" placeholder="e.g. 2022" value={form.establishedYear} onChange={(v) => update("establishedYear", v)} keyboardType="numeric" />
          <FormField label="Total Number of Flats *" placeholder="e.g. 48" value={form.totalFlats} onChange={(v) => update("totalFlats", v)} keyboardType="numeric" />
          <FormField label="Wings / Blocks" placeholder="e.g. A, B, C, D" value={form.wings} onChange={(v) => update("wings", v)} />

          <SectionHeader icon="map-marker" title="Society Address" />

          <FormField label="Street Address *" placeholder="Plot no., Sector, Layout name" value={form.address} onChange={(v) => update("address", v)} />
          <View style={styles.formRow}>
            <View style={{ flex: 1 }}>
              <FormField label="City *" placeholder="Mumbai" value={form.city} onChange={(v) => update("city", v)} />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label="State *" placeholder="Maharashtra" value={form.state} onChange={(v) => update("state", v)} />
            </View>
          </View>
          <FormField label="Pincode *" placeholder="400001" value={form.pincode} onChange={(v) => update("pincode", v)} keyboardType="numeric" />

          <SectionHeader icon="account-tie" title="Secretary / Contact Person" />

          <FormField label="Your Name *" placeholder="Full name" value={form.secretaryName} onChange={(v) => update("secretaryName", v)} />
          <FormField label="Phone Number *" placeholder="+91 98765 43210" value={form.secretaryPhone} onChange={(v) => update("secretaryPhone", v)} keyboardType="phone-pad" />
          <FormField label="Email Address" placeholder="secretary@society.com" value={form.secretaryEmail} onChange={(v) => update("secretaryEmail", v)} keyboardType="email-address" />

          <SectionHeader icon="note-text" title="Additional Notes" />
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Notes / Remarks (Optional)</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              placeholder="Any additional information or special requests..."
              placeholderTextColor={Colors.textTertiary}
              value={form.notes}
              onChangeText={(v) => update("notes", v)}
              multiline
            />
          </View>

          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.secondary} />
            <Text style={styles.disclaimerText}>
              By submitting, you confirm that all provided information is accurate and the society is legally registered with the relevant municipal authority.
            </Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed ? 0.88 : 1 }]}
            onPress={handleSubmit}
          >
            <MaterialCommunityIcons name="office-building-plus" size={20} color="#fff" />
            <Text style={styles.submitBtnText}>Submit Registration</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionHeader({ icon, title }: { icon: any; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function FormField({ label, placeholder, value, onChange, keyboardType = "default" }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  keyboardType?: any;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
      />
    </View>
  );
}

function getStatusColor(s: string) {
  if (s === "approved") return Colors.success;
  if (s === "rejected") return Colors.error;
  return Colors.warning;
}

function getStatusBg(s: string) {
  if (s === "approved") return Colors.successSoft;
  if (s === "rejected") return Colors.errorSoft;
  return Colors.warningSoft;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 20 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  headerSubtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.8)", textAlign: "center" },
  existingApplications: { backgroundColor: Colors.secondarySoft, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.secondaryBorder },
  existingHeader: { flexDirection: "row", gap: 8, alignItems: "center", marginBottom: 10 },
  existingTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: Colors.secondary },
  existingItem: { flexDirection: "row", gap: 10, alignItems: "center", paddingVertical: 6, borderTopWidth: 1, borderTopColor: Colors.secondaryBorder },
  existingName: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.text },
  existingStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  existingStatusText: { fontSize: 11, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  sectionHeader: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 6, marginBottom: 14, borderBottomWidth: 1.5, borderBottomColor: Colors.primaryBorder, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: Colors.primary },
  fieldWrap: { marginBottom: 14 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.text, marginBottom: 7 },
  input: { backgroundColor: Colors.card, borderRadius: 12, borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular", color: Colors.text },
  formRow: { flexDirection: "row", gap: 10 },
  disclaimer: { flexDirection: "row", gap: 10, backgroundColor: Colors.secondarySoft, borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: Colors.secondaryBorder },
  disclaimerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.secondary, lineHeight: 18 },
  footer: { backgroundColor: Colors.card, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  submitBtn: { flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center", backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 16 },
  submitBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  successContainer: { flex: 1 },
  successGradient: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  successIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  successTitle: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center", marginBottom: 12 },
  successSubtitle: { fontSize: 15, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 22, marginBottom: 28 },
  successInfo: { backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 16, width: "100%", gap: 10, marginBottom: 32 },
  successInfoRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  successInfoText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.9)", flex: 1 },
  successBtn: { backgroundColor: "#fff", borderRadius: 14, paddingVertical: 16, paddingHorizontal: 48 },
  successBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.primary },
});
