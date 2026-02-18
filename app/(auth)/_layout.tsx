import { Stack } from "expo-router";

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" },
                animation: "slide_from_right", // Better transitions
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="verify" options={{
                presentation: "card", // Or modal if preferred
            }} />
        </Stack>
    );
}
