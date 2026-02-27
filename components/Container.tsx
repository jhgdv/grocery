import React from "react";
import { View, ViewProps } from "react-native";

interface ContainerProps extends ViewProps {
  children: React.ReactNode;
}

export function Container({ children, style, ...props }: ContainerProps) {
  return (
    <View
      style={[
        {
          flex: 1,
          width: "100%",
          maxWidth: 1240,
          marginHorizontal: "auto",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
