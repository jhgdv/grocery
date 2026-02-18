import React from "react";
import { View, ViewProps } from "react-native";

interface ContainerProps extends ViewProps {
    children: React.ReactNode;
}

export const Container: React.FC<ContainerProps> = ({ children, style, ...props }) => {
    // Limited width container for a more professional feel on web
    return (
        <View
            style={[
                {
                    flex: 1,
                    backgroundColor: "transparent",
                    marginHorizontal: "auto",
                    width: "100%",
                    maxWidth: 550, // Roughly half of standard desktop view (e.g. 1080/2)
                },
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
};
