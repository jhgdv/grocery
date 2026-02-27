import React, { useMemo, useState } from "react";
import { Dimensions, Modal, ScrollView, Text, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";
import { BlurView } from "expo-blur";
import { FontAwesome } from "@expo/vector-icons";
import { fonts, palette, safeIconName } from "../lib/design";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type IconCategory = {
  name: string;
  icons: string[];
};

const CATEGORIES: IconCategory[] = [
  {
    name: "General",
    icons: ["list-ul", "check-square-o", "bookmark", "star", "heart", "bell", "tag", "flag", "thumb-tack", "clock-o"],
  },
  {
    name: "Shopping",
    icons: ["shopping-cart", "shopping-basket", "gift", "cutlery", "coffee", "birthday-cake", "leaf", "apple", "lemon-o"],
  },
  {
    name: "Daily",
    icons: ["home", "briefcase", "plane", "car", "map-marker", "book", "lightbulb-o", "camera", "music"],
  },
];

type IconPickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (icon: string) => void;
  selectedIcon?: string;
};

export function IconPickerModal({ visible, onClose, onSelect, selectedIcon }: IconPickerModalProps) {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].name);

  const iconSize = useMemo(() => Math.max(52, (SCREEN_WIDTH - 72) / 5 - 10), []);
  const currentIcons = CATEGORIES.find((category) => category.name === activeCategory)?.icons || CATEGORIES[0].icons;

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.26)" }}>
          <TouchableWithoutFeedback>
            <View
              style={{
                minHeight: "68%",
                maxHeight: "82%",
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: palette.line,
              }}
            >
              <BlurView intensity={76} tint="light">
                <View style={{ backgroundColor: "rgba(255,255,255,0.84)" }}>
                  <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 14 }}>
                    <View style={{ width: 38, height: 4, borderRadius: 999, backgroundColor: palette.lineStrong, marginBottom: 12 }} />
                    <Text style={{ color: palette.text, fontSize: 18, fontWeight: "700", fontFamily: fonts.bold }}>Choose an icon</Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 10, gap: 8 }}
                  >
                    {CATEGORIES.map((category) => {
                      const active = activeCategory === category.name;
                      return (
                        <TouchableOpacity
                          key={category.name}
                          onPress={() => setActiveCategory(category.name)}
                          style={{
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: active ? palette.text : palette.line,
                            backgroundColor: active ? palette.text : "rgba(255,255,255,0.4)",
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                          }}
                        >
                          <Text style={{ color: active ? "#fff" : palette.textSoft, fontWeight: "600", fontFamily: fonts.medium }}>{category.name}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 26, flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {currentIcons.map((icon) => {
                      const safeIcon = safeIconName(icon);
                      const selected = selectedIcon === icon;
                      return (
                        <TouchableOpacity
                          key={icon}
                          onPress={() => {
                            onSelect(icon);
                            onClose();
                          }}
                          style={{
                            width: iconSize,
                            height: iconSize,
                            borderRadius: 14,
                            borderWidth: 1,
                            borderColor: selected ? palette.text : palette.line,
                            backgroundColor: selected ? "rgba(21,21,21,0.12)" : "rgba(255,255,255,0.45)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FontAwesome name={safeIcon as keyof typeof FontAwesome.glyphMap} size={22} color={palette.text} />
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </BlurView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
