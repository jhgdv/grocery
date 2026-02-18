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
        user?.user_metadata?.full_name?.split(" ")[0] ||
        user?.user_metadata?.name?.split(" ")[0] ||
        user?.email?.split("@")[0]?.split(/[._-]/)[0]?.replace(/^\w/, (c: string) => c.toUpperCase()) ||
        "Friend";

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
            <View style={{ paddingHorizontal: 24, paddingTop: 20 }}>
                <Text style={{ fontSize: 34, fontWeight: "900", color: "#000000", marginBottom: 32, letterSpacing: -1 }}>Settings</Text>

                {/* Profile Card */}
                <View style={{
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: 30,
                    padding: 24,
                    marginBottom: 32,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.5)",
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 10 },
                    elevation: 4
                }}>
                    <View style={{
                        height: 64,
                        width: 64,
                        backgroundColor: "#8E8AFB",
                        borderRadius: 22,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 20,
                        shadowColor: "#8E8AFB",
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        shadowOffset: { width: 0, height: 5 }
                    }}>
                        <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>
                            {firstName.charAt(0)}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: "800", color: "#000000", marginBottom: 2 }}>
                            {firstName}
                        </Text>
                        <Text style={{ color: "#71717A", fontSize: 15, fontWeight: "500" }}>{user?.email}</Text>
                    </View>
                </View>

                {/* Preferences Section */}
                <Text style={{ color: "#000000", fontWeight: "800", marginBottom: 16, fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, marginLeft: 8 }}>Preferences</Text>
                <View style={{
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: 28,
                    overflow: "hidden",
                    marginBottom: 32,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.5)",
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 10 }
                }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#F2F1FF", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                                <FontAwesome name="bell" size={16} color="#8E8AFB" />
                            </View>
                            <Text style={{ color: "#000000", fontSize: 17, fontWeight: "600" }}>Notifications</Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: "#E5E5EA", true: "#8E8AFB" }}
                            thumbColor={notifications ? "#ffffff" : "#f4f3f4"}
                            ios_backgroundColor="#E5E5EA"
                        />
                    </View>
                </View>

                {/* Account Section */}
                <Text style={{ color: "#000000", fontWeight: "800", marginBottom: 16, fontSize: 13, textTransform: "uppercase", letterSpacing: 1.5, marginLeft: 8 }}>Account</Text>
                <View style={{
                    backgroundColor: "rgba(255,255,255,0.7)",
                    borderRadius: 28,
                    overflow: "hidden",
                    marginBottom: 32,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.5)",
                    shadowColor: "#000",
                    shadowOpacity: 0.05,
                    shadowRadius: 15,
                    shadowOffset: { width: 0, height: 10 }
                }}>
                    <TouchableOpacity
                        style={{ padding: 20, flexDirection: "row", alignItems: "center" }}
                        onPress={handleSignOut}
                        activeOpacity={0.7}
                    >
                        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "#FFF1F1", alignItems: "center", justifyContent: "center", marginRight: 16 }}>
                            <FontAwesome name="sign-out" size={18} color="#FF7E73" />
                        </View>
                        <Text style={{ color: "#FF7E73", fontWeight: "700", fontSize: 17 }}>Logout</Text>
                    </TouchableOpacity>
                </View>

                <Text style={{ textAlign: "center", color: "#A1A1AA", fontSize: 14, fontWeight: "600" }}>Version 1.1.0</Text>
            </View>
        </SafeAreaView>
    );
}
