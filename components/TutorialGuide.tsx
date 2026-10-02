/**
 * components/TutorialGuide.tsx
 *
 * The first-run "Tutorial Guide" panel on Home (see the mockups):
 *
 *   • Collapsed — a compact green bar: "TUTORIAL PROGRESS / N of 5 steps
 *     complete / Scan, post, library, messages, and explore".
 *   • Expanded — the green panel with the % circle, the 5 step rows and the
 *     "You're doing great!" footer.
 *
 * Completed rows turn dark green and show assets/images/icons/complete.png
 * instead of the "Go" pill. Progress itself lives in utils/tutorial.ts; the
 * panel only renders it and navigates on "Go".
 */
import React from "react";
import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import {
  TUTORIAL_STEPS,
  type TutorialState,
  type TutorialStep,
} from "@/utils/tutorial";

const COMPLETE_ICON = require("../assets/images/icons/complete.png");

type Props = {
  state: TutorialState;
  /** Toggle + persist the collapsed/expanded state. */
  onToggle: () => void;
};

export default function TutorialGuide({ state, onToggle }: Props) {
  const doneCount = state.done.length;
  const total = TUTORIAL_STEPS.length;
  const percent = Math.round((doneCount / total) * 100);

  function goTo(step: TutorialStep) {
    if (step.openMessages) {
      // Typed routes want a literal pathname for the object form.
      router.push({ pathname: "/tab/community", params: { tab: "messages" } });
    } else {
      router.push(step.route);
    }
  }

  const percentCircle = (
    <View style={s.circle}>
      <Text style={s.circleText}>{percent}%</Text>
    </View>
  );

  /* ------------------------------- collapsed ------------------------------ */
  if (state.collapsed) {
    return (
      <Pressable onPress={onToggle} style={s.bar}>
        {percentCircle}
        <View style={s.barText}>
          <Text style={s.barKicker}>TUTORIAL PROGRESS</Text>
          <Text style={s.barCount}>
            {doneCount} of {total} steps complete
          </Text>
          <Text style={s.barHint}>Scan, post, library, messages, and explore</Text>
        </View>
        <Text style={s.chevron}>{"\u25BC"}</Text>
      </Pressable>
    );
  }

  /* ------------------------------- expanded ------------------------------- */
  return (
    <View style={s.panel}>
      <Pressable onPress={onToggle} style={s.header}>
        {percentCircle}
        <View style={s.headerText}>
          <Text style={s.title}>Tutorial Guide</Text>
          <Text style={s.subtitle}>{total} steps to master the app</Text>
        </View>
        <Text style={s.chevron}>{"\u25B2"}</Text>
      </Pressable>

      {TUTORIAL_STEPS.map((step) => {
        const isDone = state.done.includes(step.id);
        return (
          <Pressable
            key={step.id}
            onPress={() => goTo(step)}
            style={[s.row, isDone && s.rowDone]}
          >
            <View style={s.rowIcon}>
              <Image
                source={isDone ? step.doneIcon : step.icon}
                style={isDone ? s.rowIconDone : s.rowIconImage}
                resizeMode="contain"
              />
            </View>

            <View style={s.rowText}>
              <Text style={[s.rowTitle, isDone && s.rowTitleDone]} numberOfLines={1}>
                {step.title}
              </Text>
              <Text style={[s.rowSub, isDone && s.rowSubDone]} numberOfLines={1}>
                {step.subtitle}
              </Text>
            </View>

            {isDone ? (
              <Image source={COMPLETE_ICON} style={s.check} resizeMode="contain" />
            ) : (
              <View style={s.goPill}>
                <Text style={s.goText}>Go</Text>
              </View>
            )}
          </Pressable>
        );
      })}

      <Text style={s.footer}>You're doing great!</Text>
    </View>
  );
}

const s = StyleSheet.create({
  /* shared */
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#1B4332",
    alignItems: "center",
    justifyContent: "center",
  },
  circleText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#1B4332",
  },
  chevron: {
    fontSize: 12,
    color: "#FFFFFF",
    paddingHorizontal: 6,
  },

  /* collapsed bar */
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#40916C",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  barText: {
    flex: 1,
    marginLeft: 12,
  },
  barKicker: {
    fontSize: 10,
    fontWeight: "800",
    color: "#D8F3DC",
    letterSpacing: 1,
  },
  barCount: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 1,
  },
  barHint: {
    fontSize: 11,
    color: "#D8F3DC",
    marginTop: 1,
  },

  /* expanded panel */
  panel: {
    backgroundColor: "#40916C",
    borderRadius: 20,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0B2E1F",
  },
  subtitle: {
    fontSize: 12,
    color: "#0B2E1F",
    marginTop: 1,
  },

  /* step rows */
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  rowDone: {
    backgroundColor: "#1B4332",
  },
  // Icon slot. Deliberately has NO background circle: the pending PNGs are
  // transparent and the finished "(2)" PNGs carry their own mint circle.
  rowIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconImage: {
    width: 24,
    height: 24,
  },
  rowIconDone: {
    width: 32,
    height: 32,
  },
  rowText: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#1B4332",
  },
  rowTitleDone: {
    color: "#FFFFFF",
  },
  rowSub: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 1,
  },
  rowSubDone: {
    color: "#A7CFBC",
  },
  goPill: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  goText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  check: {
    width: 26,
    height: 26,
  },
  footer: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0B2E1F",
    textAlign: "center",
    marginTop: 12,
  },
});
