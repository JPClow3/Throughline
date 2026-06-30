export const reminderSyncStateId = "reminder-sync" as const;
export const appearanceSettingsId = "appearance-settings" as const;
export const cloudSyncStateId = "cloud-sync" as const;
export const filterSettingsId = "filter-settings" as const;

export type ReminderSyncState = {
  id: typeof reminderSyncStateId;
  pushApiUrl: string;
  endpointHash?: string;
  subscriptionEndpoint?: string;
  lastReminderSyncAt?: string;
  lastReminderSyncError?: string;
  updatedAt: string;
};

export type ReminderSyncResult =
  | { status: "skipped"; reason: "missing-endpoint" | "missing-api-url" | "no-reminders" }
  | { status: "synced"; reminderCount: number }
  | { status: "failed"; error: string };

export type ThemePreference = "light" | "dark" | "system";

export type AppearanceSettings = {
  id: typeof appearanceSettingsId;
  // DEPRECATED: Kept for Dexie schema backward compatibility. No longer used in UI.
  lowPower3d: boolean;
  theme: ThemePreference;
  showGameLayer: boolean;
  hasCompletedOnboarding?: boolean;
  updatedAt: string;
};

export type CloudSyncState = {
  id: typeof cloudSyncStateId;
  /** ISO cursor: the newest updatedAt/deletedAt successfully pulled from the server. */
  lastSyncAt?: string;
  lastError?: string;
  updatedAt: string;
};

export type PersistedFilterState = {
  search: string;
  projectId: string;
  goalId: string;
  dateRange: string;
  status: string;
  priority: string;
  tags: string[];
};

export type SavedFilterPreset = {
  id: string;
  name: string;
  filters: PersistedFilterState;
};

export type FilterSettings = {
  id: typeof filterSettingsId;
  current: PersistedFilterState;
  presets: SavedFilterPreset[];
  updatedAt: string;
};

export type AppSetting = ReminderSyncState | AppearanceSettings | CloudSyncState | FilterSettings;
