import { Zap, Wind, Wrench, Droplets, Hammer, Truck, Sparkles, MoreHorizontal, Paintbrush, Bug, TreePine, Dog, type LucideIcon } from "lucide-react";

// A curated set of icons an admin can pick from when creating/editing a
// service category — deliberately not a free-text field, so a typo can't
// silently break rendering (getServiceIcon falls back to Wrench for any
// name not in this list, e.g. an old category from before an icon was
// removed from the set).
export const SERVICE_ICON_OPTIONS: { value: string; icon: LucideIcon }[] = [
  { value: "Zap", icon: Zap },
  { value: "Wind", icon: Wind },
  { value: "Wrench", icon: Wrench },
  { value: "Droplets", icon: Droplets },
  { value: "Hammer", icon: Hammer },
  { value: "Truck", icon: Truck },
  { value: "Sparkles", icon: Sparkles },
  { value: "Paintbrush", icon: Paintbrush },
  { value: "Bug", icon: Bug },
  { value: "TreePine", icon: TreePine },
  { value: "Dog", icon: Dog },
  { value: "MoreHorizontal", icon: MoreHorizontal },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  SERVICE_ICON_OPTIONS.map((o) => [o.value, o.icon])
);

export function getServiceIcon(name: string | undefined | null): LucideIcon {
  return (name && ICON_MAP[name]) || Wrench;
}
