import React from "react";
import { View, Text, Switch, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { FontAwesome } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

export default function Settings() {
    const { user, signOut } = useAuth();
    const [notifications, setNotifications] = React.useState(true);
    const isFocused = useIsFocused();

    const firstName =
        user?.user_metadata?.full_name?.split(" ")[0] || "Guest";

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    if (!isFocused) return <View style={{ flex: 1, backgroundColor: "transparent" }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "transparent" }}>
            <View style={{ padding: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: "800", color: "#1f2937", marginBottom: 24 }}>Settings</Text>

                {/* Profile */}
                <View style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 16, padding: 16, marginBottom: 24, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(229,231,235,0.6)" }}>
                    <View style={{ height: 48, width: 48, backgroundColor: "#D97D73", borderRadius: 24, alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                        <Text style={{ color: "#fff", fontSize: 20, fontWeight: "700" }}>
                            {firstName.charAt(0)}
                        </Text>
                    </View>
                    <View>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937" }}>
                            {firstName}
                        </Text>
                        <Text style={{ color: "#9ca3af" }}>{user?.email}</Text>
                    </View>
                </View>

                {/* Preferences */}
                <Text style={{ color: "#1f2937", fontWeight: "700", marginBottom: 12, fontSize: 18 }}>Preferences</Text>
                <View style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 16, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: "rgba(229,231,235,0.6)" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <FontAwesome name="bell-o" size={20} color="#1f2937" style={{ marginRight: 12, width: 24 }} />
                            <Text style={{ color: "#1f2937", fontSize: 16 }}>Notifications</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: "#cbd5e1", true: "#D97D73" }}
                            thumbColor="#ffffff"
                        />
                    </View>
                </View>

                {/* Account */}
                <Text style={{ color: "#1f2937", fontWeight: "700", marginBottom: 12, fontSize: 18 }}>Account</Text>
                <View style={{ backgroundColor: "rgba(255,255,255,0.8)", borderRadius: 16, overflow: "hidden", marginBottom: 24, borderWidth: 1, borderColor: "rgba(229,231,235,0.6)" }}>
                    <TouchableOpacity style={{ padding: 16, flexDirection: "row", alignItems: "center" }} onPress={handleSignOut}>
                        <FontAwesome name="sign-out" size={20} color="#ef4444" style={{ marginRight: 12, width: 24 }} />
                        <Text style={{ color: "#ef4444", fontWeight: "600", fontSize: 16 }}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <Text style={{ textAlign: "center", color: "#9ca3af", fontSize: 13 }}>Version 1.0.2</Text>
            </View>
        </SafeAreaView>
    );
}
