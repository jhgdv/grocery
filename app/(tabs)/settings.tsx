import React from "react";
import { View, Text, Switch, TouchableOpacity, SafeAreaView, Alert, Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { FontAwesome } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";

const COLORS = {
    bg: "#F4F6FC",
    white: "#FFFFFF",
    primary: "#6BA0D8",
    primarySoft: "rgba(107, 160, 216, 0.1)",
    accent: "#B39DDB",
    accentSoft: "rgba(179, 157, 219, 0.12)",
    success: "#5BC8A4",
    successSoft: "rgba(91, 200, 164, 0.1)",
    danger: "#E58A8A",
    dangerSoft: "rgba(229, 138, 138, 0.1)",
    text: "#1E293B",
    textSecondary: "#5C6E82",
    textTertiary: "#94A3B8",
    border: "#DDE6F4",
    borderLight: "#EEF3FA",
};

// Medical Card Component
function AppCard({ children, style }: { children: React.ReactNode; style?: any }) {
    return (
        <View style={[
            {
                backgroundColor: COLORS.white,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: COLORS.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
            },
            style
        ]}>
            {children}
        </View>
    );
}

export default function Settings() {
    const { user, signOut } = useAuth();
    const [notifications, setNotifications] = React.useState(true);
    const isFocused = useIsFocused();

    const firstName =
        user?.user_metadata?.full_name?.split(" ")[0] ||
        user?.user_metadata?.name?.split(" ")[0] ||
        user?.email?.split("@")[0]?.split(/[._-]/)[0]?.replace(/^\w/, (c: string) => c.toUpperCase()) ||
        "User";

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
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
                <Text style={{ 
                    fontSize: 28, 
                    fontWeight: "800", 
                    color: COLORS.text, 
                    marginBottom: 24, 
                    letterSpacing: -0.5,
                }}>
                    Settings
                </Text>

                {/* Profile Card */}
                <AppCard style={{ marginBottom: 24 }}>
                    <View style={{
                        padding: 20,
                        flexDirection: "row",
                        alignItems: "center",
                    }}>
                        <View style={{
                            height: 60,
                            width: 60,
                            borderRadius: 18,
                            backgroundColor: COLORS.primarySoft,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 16,
                            borderWidth: 1,
                            borderColor: "rgba(14, 165, 233, 0.2)",
                        }}>
                            <Text style={{ 
                                color: COLORS.primary, 
                                fontSize: 22, 
                                fontWeight: "800",
                            }}>
                                {firstName.charAt(0)}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ 
                                fontSize: 18, 
                                fontWeight: "800", 
                                color: COLORS.text, 
                                marginBottom: 2,
                            }}>
                                {firstName}
                            </Text>
                            <Text style={{ 
                                color: COLORS.textSecondary, 
                                fontSize: 14, 
                                fontWeight: "500",
                            }}>
                                {user?.email}
                            </Text>
                        </View>
                        <TouchableOpacity style={{
                            padding: 10,
                            backgroundColor: COLORS.borderLight,
                            borderRadius: 10,
                        }}>
                            <FontAwesome name="pencil" size={16} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </AppCard>

                {/* Preferences Section */}
                <Text style={{ 
                    color: COLORS.textSecondary, 
                    fontWeight: "800", 
                    marginBottom: 12, 
                    fontSize: 13, 
                    textTransform: "uppercase", 
                    letterSpacing: 0.5, 
                    marginLeft: 4,
                }}>
                    Preferences
                </Text>
                
                <AppCard style={{ marginBottom: 24 }}>
                    <View style={{ 
                        flexDirection: "row", 
                        alignItems: "center", 
                        justifyContent: "space-between", 
                        padding: 18,
                    }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: 10, 
                                backgroundColor: COLORS.primarySoft, 
                                alignItems: "center", 
                                justifyContent: "center", 
                                marginRight: 14,
                            }}>
                                <FontAwesome name="bell" size={18} color={COLORS.primary} />
                            </View>
                            <Text style={{ 
                                color: COLORS.text, 
                                fontSize: 16, 
                                fontWeight: "600",
                            }}>
                                Notifications
                            </Text>
                        </View>
                        <Switch
                            value={notifications}
                            onValueChange={setNotifications}
                            trackColor={{ false: COLORS.border, true: COLORS.primary }}
                            thumbColor={notifications ? "#fff" : "#fff"}
                            ios_backgroundColor={COLORS.border}
                        />
                    </View>
                    
                    <View style={{ height: 1, backgroundColor: COLORS.border, marginHorizontal: 18 }} />
                    
                    <TouchableOpacity style={{ 
                        flexDirection: "row", 
                        alignItems: "center", 
                        justifyContent: "space-between", 
                        padding: 18,
                    }}>
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: 10, 
                                backgroundColor: COLORS.successSoft, 
                                alignItems: "center", 
                                justifyContent: "center", 
                                marginRight: 14,
                            }}>
                                <FontAwesome name="lock" size={18} color={COLORS.success} />
                            </View>
                            <Text style={{ 
                                color: COLORS.text, 
                                fontSize: 16, 
                                fontWeight: "600",
                            }}>
                                Privacy & Security
                            </Text>
                        </View>
                        <FontAwesome name="chevron-right" size={16} color={COLORS.textTertiary} />
                    </TouchableOpacity>
                </AppCard>

                {/* Account Section */}
                <Text style={{ 
                    color: COLORS.textSecondary, 
                    fontWeight: "800", 
                    marginBottom: 12, 
                    fontSize: 13, 
                    textTransform: "uppercase", 
                    letterSpacing: 0.5, 
                    marginLeft: 4,
                }}>
                    Account
                </Text>
                
                <AppCard style={{ marginBottom: 24 }}>
                    <TouchableOpacity
                        style={{ 
                            padding: 18, 
                            flexDirection: "row", 
                            alignItems: "center",
                        }}
                        onPress={handleSignOut}
                        activeOpacity={0.7}
                    >
                        <View style={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: 10, 
                            backgroundColor: COLORS.dangerSoft, 
                            alignItems: "center", 
                            justifyContent: "center", 
                            marginRight: 14,
                        }}>
                            <FontAwesome name="sign-out" size={18} color={COLORS.danger} />
                        </View>
                        <Text style={{ 
                            color: COLORS.danger, 
                            fontWeight: "700", 
                            fontSize: 16,
                        }}>
                            Logout
                        </Text>
                    </TouchableOpacity>
                </AppCard>

                <Text style={{ 
                    textAlign: "center", 
                    color: COLORS.textTertiary, 
                    fontSize: 13, 
                    fontWeight: "600",
                }}>
                    Version 1.1.0 • LYST
                </Text>
            </View>
        </SafeAreaView>
    );
}
