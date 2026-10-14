/**
 * components/ScanWalkthrough.tsx
 *
 * The first-run coach-mark walkthrough over the Scan screen (mockups
 * "Scan(tutorial1..4).png"). Home's Tutorial Guide triggers it: pressing
 * Go on "Scan & Post" pushes /scan?walkthrough=<token> — a fresh
 * timestamp per press, so the sequence replays on demand.
 *
 * All of the overlay machinery lives in components/CoachWalkthrough.tsx;
 * this file is just the Scan screen's step content plus the rule that
 * finishing it completes the guide's "Scan & Post" row.
 */
import React from "react";
import CoachWalkthrough, { type CoachStep } from "@/components/CoachWalkthrough";
import type { CoachWalkthroughProps } from "@/components/CoachWalkthrough";
import { markTutorialStep } from "@/utils/tutorial";

type Props = Omit<CoachWalkthroughProps, "steps" | "finishLabel">;

// Copy is verbatim from the mockups.
const SCAN_STEPS: CoachStep[] = [
  {
    id: 1,
    target: "takePhoto",
    card: "above",
    header: "dots",
    footer: "next",
    estHeight: 210,
    title: "Take a photo",
    body: "Use your camera to photograph a medicinal plant. This is the first step in the scanning process.",
  },
  {
    id: 2,
    target: "uploadPhoto",
    card: "above",
    header: "badge",
    footer: "bottomBar",
    estHeight: 160,
    title: "Upload photo",
    body: "Choose an existing plant photo from your gallery to continue the scan.",
  },
  {
    id: 3,
    target: "preview",
    card: "below",
    header: "pill",
    footer: "backNext",
    estHeight: 270,
    title: "Keep leaves and details visible",
    body: "A clear plant photo should show the leaves and distinctive details clearly. This helps the scanner recognize the shape, color, and texture of the plant.",
  },
  {
    id: 4,
    target: "tips",
    card: "above",
    header: "progress",
    footer: "getStarted",
    estHeight: 340,
    fullWidth: true,
    title: "Tips for better results",
    body: "Use natural lighting, keep the plant in focus, and include leaf shape, color, and texture for the best match.",
    tip: "Natural light, sharp focus, and visible leaf details help the scanner identify the plant more accurately.",
  },
];

export default function ScanWalkthrough(props: Props) {
  async function handleFinish() {
    // Seeing the walkthrough through (or leaving early) completes the
    // guide's "Scan & Post" row — same "you've seen this feature" rule
    // History and Library follow. No-op for guests/veterans.
    await markTutorialStep("scanpost");
    props.onFinish();
  }

  return (
    <CoachWalkthrough
      steps={SCAN_STEPS}
      finishLabel="Get started"
      {...props}
      onFinish={handleFinish}
    />
  );
}
