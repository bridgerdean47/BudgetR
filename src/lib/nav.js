// src/lib/nav.js
import { HomeIcon, InsightsIcon, ActivityIcon, ProfileIcon } from "../components/icons.jsx";

// Single source of truth for the app's 4 destinations — consumed by both
// the mobile BottomTabBar and the desktop top nav.
export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "insights", label: "Insights", icon: InsightsIcon },
  { id: "activity", label: "Activity", icon: ActivityIcon },
  { id: "profile", label: "Profile", icon: ProfileIcon },
];
