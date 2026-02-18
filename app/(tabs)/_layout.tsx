import { Tabs, useRouter } from "expo-router";
import { View, Platform, Text } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

export default function TabLayout() {
    const router = useRouter();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    position: "absolute",
                    bottom: Platform.OS === "web" ? 20 : 32,
                    left: 20,
                    right: 20,
                    backgroundColor: "rgba(255, 255, 255, 0.8)",
                    borderRadius: 32,
                    height: 72,
                    borderTopWidth: 0,
                    shadowColor: "#8E8AFB",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.1,
                    shadowRadius: 20,
                    paddingBottom: 0,
                    paddingTop: 0,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.5)",
                    elevation: 10,
                },
                tabBarActiveTintColor: "#8E8AFB",
                tabBarInactiveTintColor: "#A1A1AA",
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: "800",
                    marginBottom: 12,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                },
                tabBarIconStyle: {
                    marginTop: 10,
                },
                tabBarItemStyle: {
                    height: 72,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Lists",
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="list-ul" size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="create"
                listeners={() => ({
                    tabPress: (e) => {
                        e.preventDefault();
                        router.push("/list/create");
                    },
                })}
                options={{
                    title: "",
                    tabBarIcon: () => (
                        <View
                            style={{
                                height: 56,
                                width: 56,
                                borderRadius: 22,
                                backgroundColor: "#8E8AFB",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 24,
                                shadowColor: "#8E8AFB",
                                shadowOffset: { width: 0, height: 8 },
                                shadowOpacity: 0.4,
                                shadowRadius: 12,
                                elevation: 8,
                                borderWidth: 2,
                                borderColor: "rgba(255, 255, 255, 0.5)",
                            }}
                        >
                            <FontAwesome name="plus" size={24} color="white" />
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: "Settings",
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="cog" size={22} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
