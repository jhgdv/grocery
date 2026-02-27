import React from "react";
import { Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { BlurView } from "expo-blur";
import { FontAwesome } from "@expo/vector-icons";
import { fonts, palette } from "../lib/design";

type ActionItem = {
  icon: keyof typeof FontAwesome.glyphMap;
  label: string;
  action: () => void;
  color?: string;
  destructive?: boolean;
};

type ListActionModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  actions: ActionItem[];
  anchorTop?: number;
  anchorRight?: number;
};

export function ListActionModal({ visible, onClose, title, actions, anchorTop, anchorRight }: ListActionModalProps) {
  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}>
          <TouchableWithoutFeedback>
            <View
              style={{
                position: "absolute",
                top: anchorTop ?? 84,
                right: anchorRight ?? 16,
                width: 250,
                borderRadius: 18,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <BlurView intensity={70} tint="light">
                <View style={{ backgroundColor: "rgba(255,255,255,0.75)" }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      paddingHorizontal: 16,
                      paddingTop: 14,
                      paddingBottom: 10,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      color: palette.textMuted,
                      fontWeight: "700",
                      fontFamily: fonts.medium,
                    }}
                  >
                    {title}
                  </Text>

                  <View style={{ height: 1, backgroundColor: palette.line }} />

                  <View style={{ padding: 8 }}>
                    {actions.map((item, index) => {
                      const textColor = item.destructive ? palette.danger : item.color || palette.text;
                      return (
                        <TouchableOpacity
                          key={`${item.label}-${index}`}
                          onPress={() => {
                            onClose();
                            setTimeout(item.action, 120);
                          }}
                          style={{
                            minHeight: 40,
                            borderRadius: 11,
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 12,
                            marginBottom: index === actions.length - 1 ? 0 : 4,
                          }}
                        >
                          <FontAwesome name={item.icon} size={15} color={textColor} style={{ width: 24 }} />
                          <Text style={{ color: textColor, fontWeight: "600", fontFamily: fonts.medium }}>{item.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </BlurView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
