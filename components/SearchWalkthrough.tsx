/**
 * components/SearchWalkthrough.tsx
 *
 * The first-run coach-mark walkthrough over the Library / Search screen
 * (the user's "Search Medicinal Plant" walkthrough mockups). Home's
 * Tutorial Guide triggers it: pressing Go on "Library" pushes
 * /search?walkthrough=1 while that row is still unfinished.
 *
 * All of the overlay machinery lives in components/CoachWalkthrough.tsx;
 * this file is just the Search screen's step content.
 *
 * No persistence happens on finish: app/search.tsx already marks the
 * guide's "library" step complete on every visit, and the Guide only
 * sends the walkthrough param from an unfinished row — so the sequence
 * plays exactly once per new account, guests and veterans never see it.
 *
 * The mockups had the same placeholder body in all three cards; the
 * copy below is written per step so each card describes what it
 * highlights (the body text is the only thing that differs — layout,
 * spotlight order and card placement follow the mockups).
 */
import React from "react";
import CoachWalkthrough, { type CoachStep } from "@/components/CoachWalkthrough";
import type { CoachWalkthroughProps } from "@/components/CoachWalkthrough";

type Props = Omit<CoachWalkthroughProps, "steps" | "finishLabel">;

const SEARCH_STEPS: CoachStep[] = [
  {
    id: 1,
    target: "searchBar",
    card: "below",
    header: "pill",
    footer: "next",
    estHeight: 200,
    title: "Search by plant or symptom",
    body: "Type a plant name or a health concern like cough or indigestion — matching medicinal plants are listed right below as you type.",
  },
  {
    id: 2,
    target: "recentSearches",
    card: "below",
    header: "pill",
    footer: "backNext",
    estHeight: 210,
    title: "Use Recent Searches",
    body: "The terms you've looked up appear here as chips. Tap one to run that search again instantly, or press clear to remove them all.",
  },
  {
    id: 3,
    target: "recommendations",
    card: "above",
    header: "pill",
    footer: "backNext",
    nextLabel: "Done",
    estHeight: 210,
    title: "Check Recommendations",
    body: "A quick pick of medicinal plants like Lagundi, Sambong, and Oregano. Tap any card to learn what it's used for.",
  },
];

export default function SearchWalkthrough(props: Props) {
  return <CoachWalkthrough steps={SEARCH_STEPS} finishLabel="Done" {...props} />;
}
