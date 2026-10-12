/**
 * components/HistoryWalkthrough.tsx
 *
 * The first-run coach-mark walkthrough over the History screen (the
 * user's "Your scan history" walkthrough mockup). Home's Tutorial Guide
 * triggers it: pressing Go on "History" pushes /tab/history?
 * walkthrough=1 while that row is unfinished.
 *
 * All of the overlay machinery lives in components/CoachWalkthrough.tsx;
 * this file is just the step content. A single card, so no step chrome —
 * exactly like the mockup (title, body, Get started).
 *
 * No persistence happens on finish: app/tab/history.tsx already marks
 * the guide's "history" step on every visit, and the Guide only sends
 * the walkthrough param from an unfinished row — so it plays once.
 */
import React from "react";
import CoachWalkthrough, { type CoachStep } from "@/components/CoachWalkthrough";
import type { CoachWalkthroughProps } from "@/components/CoachWalkthrough";

type Props = Omit<CoachWalkthroughProps, "steps" | "finishLabel">;

// Copy follows the mockup (it already described this screen accurately).
const HISTORY_STEPS: CoachStep[] = [
  {
    id: 1,
    target: "content",
    card: "above",
    header: "none",
    footer: "getStarted",
    estHeight: 200,
    title: "Your scan history",
    body: "After you scan a plant, the results will appear here. You'll see the plant identification, accuracy score, and the date and time of each scan.",
  },
];

export default function HistoryWalkthrough(props: Props) {
  return <CoachWalkthrough steps={HISTORY_STEPS} {...props} />;
}
