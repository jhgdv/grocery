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
                    bottom: Platform.OS === "web" ? 16 : 24,
                    left: 12,
                    right: 12,
                    elevation: 8,
                    backgroundColor: "#ffffff",
                    borderRadius: 28,
                    height: 70,
                    borderTopWidth: 0,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.08,
                    shadowRadius: 20,
                    paddingBottom: 0,
                    paddingTop: 0,
                    paddingHorizontal: 8,
                },
                tabBarActiveTintColor: "#D97D73",
                tabBarInactiveTintColor: "#9ca3af",
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: "700",
                    marginBottom: 10,
                },
                tabBarIconStyle: {
                    marginTop: 8,
                },
                tabBarItemStyle: {
                    minWidth: 70,
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
                                height: 52,
                                width: 52,
                                borderRadius: 26,
                                backgroundColor: "#D97D73",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 18,
                                shadowColor: "#D97D73",
                                shadowOffset: { width: 0, height: 6 },
                                shadowOpacity: 0.35,
                                shadowRadius: 10,
                                elevation: 8,
                            }}
                        >
                            <FontAwesome name="plus" size={22} color="white" />
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
