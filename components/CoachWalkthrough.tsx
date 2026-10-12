/**
 * components/CoachWalkthrough.tsx
 *
 * The generic coach-mark engine behind the first-run walkthroughs
 * (mockups "Scan(tutorial1..4).png" and the Library/Search walkthrough).
 *
 * Not a Modal on purpose: the overlay renders INSIDE the host screen's
 * root view, so the spotlight frames (measured with measureInWindow)
 * line up exactly with the real UI. Four dim rectangles leave a "hole"
 * around the element each step talks about — it stays bright inside a
 * white ring while everything else is covered and can't be touched.
 *
 * The screen auto-scrolls just enough to fit the target plus its card,
 * so steps also work when the element sits below the fold.
 *
 * Chrome per step mirrors the mockups and is configured by the step:
 *   header: "dots" | "badge" | "pill" | "progress"
 *   footer: "next" | "bottomBar" | "backNext" | "getStarted"
 * The final step's Next (whatever its footer) finishes the walkthrough.
 *
 * The host screen decides WHO sees it (see utils/tutorial.ts) and does
 * the persistence on finish — this component only plays the sequence.
 */
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, BackHandler } from "react-native";
import type { RefObject } from "react";

/* ---------------------------------- data --------------------------------- */

export type CoachStep = {
  id: number;
  /** Key in the `targets` record — the element this step is about. */
  target: string;
  /** Card goes above the highlighted element, below it, or screen-bottom. */
  card: "above" | "below" | "bottom";
  /** "none" renders a bare card (the single-card mockups have no chrome). */
  header: "none" | "dots" | "badge" | "pill" | "progress";
  footer: "next" | "bottomBar" | "backNext" | "getStarted";
  /** Rough card height, only used to work out the auto-scroll. */
  estHeight: number;
  title: string;
  body: string;
  /** Optional mint info block under the body (Scan step 4 uses it). */
  tip?: string;
  /** Label of the forward button; defaults to "Next". */
  nextLabel?: string;
  /** getStarted button stretches full width (Scan step 4) instead of hugging. */
  fullWidth?: boolean;
};

const GREEN = "#40916C";
const INK = "#111827";
const MUTED = "#6B7280";
const MINT = "#D8F3DC";
/** Same hue family as the screens, just dark enough to sink the UI behind. */
const DIM = "rgba(16, 38, 26, 0.55)";
const CARD_MARGIN = 20;
const CARD_GAP = 12;
/** Keeps the card clear of the status bar when it lands near the top. */
const TOP_SAFE = 52;
const BOTTOM_SAFE = 20;

type Rect = { x: number; y: number; w: number; h: number };

export type CoachWalkthroughProps = {
  /** The sequence this screen plays. */
  steps: CoachStep[];
  /** Refs of the elements the steps spotlight, keyed by CoachStep.target. */
  targets: Record<string, RefObject<View | null>>;
  /**
   * Scrolls the host's list to an offset. ScrollView hosts can use
   * scrollRef.scrollTo; FlatList hosts use scrollToOffset. Optional —
   * without it the engine only highlights what's already on screen
   * (fine for walkthroughs that never leave the first screenful).
   */
  scrollTo?: (y: number) => void;
  /** Live scroll bookkeeping used to clamp the auto-scroll (with scrollTo). */
  scrollYRef?: RefObject<number>;
  contentHRef?: RefObject<number>;
  viewportHRef?: RefObject<number>;
  /** Label of the final step's button (default "Get started"). */
  finishLabel?: string;
  /** Hide the overlay (step-completion persistence happens in here). */
  onFinish: () => void;
};

/* ------------------------------ small pieces ------------------------------ */

function SkipPill({ onPress, soft }: { onPress: () => void; soft?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={[s.skip, soft ? s.skipSoft : s.skipOutline]}
    >
      <Text style={[s.skipText, soft && { color: "#374151" }]}>Skip</Text>
    </Pressable>
  );
}

function BackPill({ onPress, withArrow }: { onPress: () => void; withArrow?: boolean }) {
  return (
    <Pressable onPress={onPress} style={s.skipOutline}>
      <Text style={s.backText}>{withArrow ? "←  Back" : "Back"}</Text>
    </Pressable>
  );
}

function GreenButton({
  onPress,
  label,
  withArrow,
  full,
}: {
  onPress: () => void;
  label: string;
  withArrow?: boolean;
  full?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={[s.greenBtn, full ? { flex: 1 } : undefined]}>
      <Text style={s.greenBtnText}>{withArrow ? `${label}  →` : label}</Text>
    </Pressable>
  );
}

/* ------------------------------- component -------------------------------- */

export default function CoachWalkthrough({
  steps,
  targets,
  scrollTo,
  scrollYRef,
  contentHRef,
  viewportHRef,
  finishLabel = "Get started",
  onFinish,
}: CoachWalkthroughProps) {
  const [index, setIndex] = useState(0);
  const [frame, setFrame] = useState<Rect | null>(null);
  const [screen, setScreen] = useState<{ w: number; h: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const step = steps[index];
  const total = steps.length;

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  async function finish() {
    // Host screens mark their own tutorial step / persistence here.
    onFinish();
  }

  function goNext() {
    if (index >= total - 1) finish();
    else setIndex(index + 1);
  }

  /* ---- measuring + auto-scroll ---- */

  /**
   * How far the ScrollView must move so both the target and its card
   * fit on screen. Negative = scroll up, positive = scroll down.
   */
  function fitDelta(r: Rect, st: CoachStep, screenH: number): number {
    if (st.card === "bottom") {
      // Card is pinned to the screen bottom — only the target itself
      // needs to be reachable.
      return r.y < TOP_SAFE ? TOP_SAFE - r.y : 0;
    }
    if (st.card === "above") {
      // Card sits from (r.y - gap - estHeight) up to just above the target.
      let delta = 0;
      const cardTop = r.y - CARD_GAP - st.estHeight;
      if (cardTop < TOP_SAFE) delta = cardTop - TOP_SAFE;
      const targetBottom = r.y + r.h;
      if (targetBottom > screenH - BOTTOM_SAFE) {
        delta = Math.max(delta, targetBottom - (screenH - BOTTOM_SAFE));
      }
      return delta;
    }
    // Card sits below the target: keep it (and the target) on screen.
    let delta = 0;
    const cardBottom = r.y + r.h + CARD_GAP + st.estHeight;
    if (cardBottom > screenH - BOTTOM_SAFE) {
      delta = cardBottom - (screenH - BOTTOM_SAFE);
    }
    if (r.y < TOP_SAFE) delta = Math.max(delta, TOP_SAFE - r.y);
    return delta;
  }

  function measure(target: View) {
    target.measureInWindow((x, y, w, h) => {
      const r = { x, y, w, h };
      const delta = screen ? fitDelta(r, step, screen.h) : 0;
      const needsScroll = scrollTo && Math.abs(delta) > 4;
      if (!needsScroll) {
        setFrame(r);
        return;
      }
      // Clamp to the scrollable range, then re-measure once the move
      // (non-animated, so it lands within a frame or two) has happened.
      const max = Math.max(0, (contentHRef?.current ?? 0) - (viewportHRef?.current ?? 0));
      const to = Math.min(Math.max(0, (scrollYRef?.current ?? 0) + delta), max);
      if (scrollYRef) scrollYRef.current = to;
      scrollTo!(to);
      clearTimer();
      timerRef.current = setTimeout(() => {
        target.measureInWindow((x2, y2, w2, h2) =>
          setFrame({ x: x2, y: y2, w: w2, h: h2 })
        );
      }, 90);
    });
  }

  // On every step change (and once the overlay knows its own size),
  // clear the old hole and line the new one up.
  useEffect(() => {
    setFrame(null);
  }, [index]);

  useEffect(() => {
    if (!screen) return; // wait for the overlay's own layout first
    clearTimer();
    timerRef.current = setTimeout(() => {
      const target = targets[step.target]?.current;
      if (!target) {
        // Nothing to highlight (e.g. an empty feed) — never strand the
        // user behind a dimmed screen: move on, or end if it's the end.
        if (index < total - 1) setIndex(index + 1);
        else finish();
        return;
      }
      measure(target);
    }, 70);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, screen]);

  // Android back walks one step back; on step 1 it ends the walkthrough.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (index > 0) setIndex(index - 1);
      else finish();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  /* ---- chrome per step (mirrors the mockups) ---- */

  function renderHeader() {
    if (step.header === "none") {
      return null;
    }
    if (step.header === "dots") {
      return (
        <View style={s.headerRow}>
          <Text style={s.stepGreen}>Step {step.id} of {total}</Text>
          <View style={s.dots}>
            {steps.map((st) => (
              <View key={st.id} style={[s.dot, st.id === step.id && s.dotActive]} />
            ))}
          </View>
          <View style={{ flex: 1 }} />
          <SkipPill onPress={finish} soft />
        </View>
      );
    }
    if (step.header === "badge") {
      return (
        <View style={s.headerRow}>
          <View style={s.badge}>
            <Text style={s.badgeText}>{step.id} of {total}</Text>
          </View>
          <Text style={s.cardTitle}>{step.title}</Text>
        </View>
      );
    }
    if (step.header === "pill") {
      return (
        <View style={s.headerRow}>
          <View style={s.badge}>
            <Text style={s.badgeText}>Step {step.id} of {total}</Text>
          </View>
          <View style={{ flex: 1 }} />
          <SkipPill onPress={finish} />
        </View>
      );
    }
    // progress
    return (
      <View style={s.headerRow}>
        <Text style={s.stepInk}>{step.id} of {total}</Text>
        <View style={s.progressTrack}>
          <View style={s.progressFill} />
        </View>
        <BackPill onPress={() => setIndex(index - 1)} withArrow />
      </View>
    );
  }

  function renderFooter() {
    if (step.footer === "next") {
      return (
        <View style={s.footerRow}>
          <GreenButton onPress={goNext} label={step.nextLabel ?? "Next"} />
        </View>
      );
    }
    if (step.footer === "backNext") {
      return (
        <View style={s.footerRow}>
          <Pressable onPress={() => setIndex(index - 1)} style={s.outlineBtn}>
            <Text style={s.outlineBtnText}>Back</Text>
          </Pressable>
          <GreenButton onPress={goNext} label={step.nextLabel ?? "Next"} />
        </View>
      );
    }
    if (step.footer === "getStarted") {
      return <GreenButton onPress={finish} label={finishLabel} full={step.fullWidth} />;
    }
    return null; // bottomBar lives outside the card
  }

  function renderBottomBar() {
    return (
      <View style={s.bottomBar}>
        <Pressable onPress={() => setIndex(index - 1)} style={[s.barBtn, s.barBack]}>
          <Text style={s.barBackText}>←  Back</Text>
        </Pressable>
        <Pressable onPress={finish} style={[s.barBtn, s.barBack]}>
          <Text style={s.barBackText}>Skip</Text>
        </Pressable>
        <Pressable onPress={goNext} style={[s.barBtn, s.barNext]}>
          <Text style={s.barNextText}>{step.nextLabel ?? "Next"}  →</Text>
        </Pressable>
      </View>
    );
  }

  /* ---- overlay ---- */

  // Full dim while the first measurement is in flight (a beat or two).
  if (!screen || !frame) {
    return (
      <View
        style={StyleSheet.absoluteFill}
        onLayout={(e) =>
          setScreen({
            w: e.nativeEvent.layout.width,
            h: e.nativeEvent.layout.height,
          })
        }
      >
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: DIM }]}
          onPress={() => {}}
        />
      </View>
    );
  }

  const hole = frame;
  const cardPos =
    step.card === "above"
      ? { bottom: screen.h - hole.y + CARD_GAP }
      : step.card === "bottom"
        ? { bottom: BOTTOM_SAFE + 4 }
        : { top: hole.y + hole.h + CARD_GAP };

  return (
    <View
      style={StyleSheet.absoluteFill}
      onLayout={(e) =>
        setScreen({
          w: e.nativeEvent.layout.width,
          h: e.nativeEvent.layout.height,
        })
      }
    >
      {/* Dim everywhere EXCEPT the hole around the highlighted element. */}
      <Pressable
        style={{ position: "absolute", left: 0, top: 0, width: screen.w, height: Math.max(0, hole.y), backgroundColor: DIM }}
        onPress={() => {}}
      />
      <Pressable
        style={{ position: "absolute", left: 0, top: hole.y + hole.h, width: screen.w, height: Math.max(0, screen.h - hole.y - hole.h), backgroundColor: DIM }}
        onPress={() => {}}
      />
      <Pressable
        style={{ position: "absolute", left: 0, top: hole.y, width: Math.max(0, hole.x), height: hole.h, backgroundColor: DIM }}
        onPress={() => {}}
      />
      <Pressable
        style={{ position: "absolute", left: hole.x + hole.w, top: hole.y, width: Math.max(0, screen.w - hole.x - hole.w), height: hole.h, backgroundColor: DIM }}
        onPress={() => {}}
      />

      {/* White ring so the spotlight reads even over pale UI. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: hole.x - 3,
          top: hole.y - 3,
          width: hole.w + 6,
          height: hole.h + 6,
          borderRadius: 19,
          borderWidth: 3,
          borderColor: "rgba(255,255,255,0.95)",
        }}
      />

      {/* The card */}
      <View style={[s.card, cardPos]}>
        {renderHeader()}
        {/* Title lives in the header row for the badge variant */}
        {step.header !== "badge" && <Text style={s.cardTitle}>{step.title}</Text>}
        <Text style={s.cardBody}>{step.body}</Text>
        {step.tip && (
          <View style={s.tipBox}>
            <View style={s.tipIconCircle}>
              <Text style={s.tipIconText}>i</Text>
            </View>
            <Text style={s.tipText}>{step.tip}</Text>
          </View>
        )}
        {renderFooter()}
      </View>

      {/* The bottomBar footer floats at the screen bottom */}
      {step.footer === "bottomBar" && renderBottomBar()}
    </View>
  );
}

/* --------------------------------- styles --------------------------------- */

const s = StyleSheet.create({
  card: {
    position: "absolute",
    left: CARD_MARGIN,
    right: CARD_MARGIN,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  stepGreen: {
    fontSize: 14,
    fontWeight: "800",
    color: GREEN,
  },
  stepInk: {
    fontSize: 14,
    fontWeight: "800",
    color: INK,
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D1D5DB",
  },
  dotActive: {
    backgroundColor: GREEN,
  },
  badge: {
    backgroundColor: MINT,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#2D6A4F",
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  progressFill: {
    width: "85%",
    height: "100%",
    borderRadius: 3,
    backgroundColor: GREEN,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: "800",
    color: INK,
    marginBottom: 6,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
  },
  tipBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 14,
    backgroundColor: "#F3F7F4",
    borderRadius: 12,
    padding: 10,
  },
  tipIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: MINT,
    alignItems: "center",
    justifyContent: "center",
  },
  tipIconText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#2D6A4F",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#374151",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  skip: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  skipSoft: {
    backgroundColor: "#F3F4F6",
  },
  skipOutline: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  skipText: {
    fontSize: 13,
    fontWeight: "700",
    color: MUTED,
  },
  backText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  greenBtn: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingHorizontal: 26,
    paddingVertical: 11,
    alignItems: "center",
  },
  greenBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  outlineBtn: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
  },
  outlineBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  bottomBar: {
    position: "absolute",
    left: CARD_MARGIN,
    right: CARD_MARGIN,
    bottom: BOTTOM_SAFE + 4,
    flexDirection: "row",
    gap: 10,
  },
  barBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  barBack: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  barBackText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  barNext: {
    backgroundColor: GREEN,
  },
  barNextText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
