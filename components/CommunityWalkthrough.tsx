/**
 * components/CommunityWalkthrough.tsx
 *
 * The first-run coach-mark walkthroughs over the Community screen
 * (the user's "View Posts" and "Message" walkthrough mockups). Home's
 * Tutorial Guide triggers them:
 *   • Go on "View Posts"  → /tab/community?walkthrough=1          (feed)
 *   • Go on "Message"     → /tab/community?tab=messages&walkthrough=1
 *
 * All of the overlay machinery lives in components/CoachWalkthrough.tsx;
 * this file is just the step content for each tab.
 *
 * No persistence happens on finish: app/tab/community.tsx already marks
 * "viewposts" when the feed opens and "message" when the Messages tab
 * opens, and the Guide only sends the walkthrough param from an
 * unfinished row — so each sequence plays exactly once per new account.
 *
 * The feed mockups repeated one placeholder body and had no buttons;
 * its copy is written per step. The Messages card follows its mockup
 * (title, one-line body, Get started) exactly.
 */
import React from "react";
import CoachWalkthrough, { type CoachStep } from "@/components/CoachWalkthrough";
import type { CoachWalkthroughProps } from "@/components/CoachWalkthrough";

type Props = Omit<CoachWalkthroughProps, "steps" | "finishLabel"> & {
  /** Which tab's walkthrough to play. */
  variant: "feed" | "messages";
};

// News Feed: the search bar first, then the discoveries below it.
const FEED_STEPS: CoachStep[] = [
  {
    id: 1,
    target: "searchBar",
    card: "below",
    header: "pill",
    footer: "next",
    estHeight: 200,
    title: "Search for a Specific Discovery",
    body: "Type a medicinal plant name into the search bar to instantly filter the feed down to the posts about that plant.",
  },
  {
    id: 2,
    target: "firstPost",
    card: "below",
    header: "pill",
    footer: "getStarted",
    estHeight: 220,
    title: "Browse community discoveries",
    body: "See what other users have found — every post shows the plant, who found it, and when. Tap Send Message to ask the author about their discovery, or the pin to see it on the map.",
  },
];

// Messages: a single card over the conversation list.
const MESSAGES_STEPS: CoachStep[] = [
  {
    id: 1,
    target: "conversations",
    card: "bottom",
    header: "none",
    footer: "getStarted",
    estHeight: 180,
    title: "Open a conversation",
    body: "Open a conversation to read messages and continue chatting.",
  },
];

export default function CommunityWalkthrough({ variant, ...props }: Props) {
  const steps = variant === "messages" ? MESSAGES_STEPS : FEED_STEPS;
  return <CoachWalkthrough steps={steps} {...props} />;
}
