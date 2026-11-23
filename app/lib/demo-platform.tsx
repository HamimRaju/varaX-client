"use client";

// Temporary compatibility exports for routes migrated in separate commits.
export {
  PlatformProvider as DemoPlatformProvider,
  usePlatform as useDemoPlatform,
  mapEquipment,
} from "./platform-context";
export type * from "./platform-context";
