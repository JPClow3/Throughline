export const reminderSyncStateId = "reminder-sync" as const;
export const appearanceSettingsId = "appearance-settings" as const;
export const cloudSyncStateId = "cloud-sync" as const;

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
  lowPower3d: boolean;
  theme: ThemePreference;
  showGameLayer: boolean;
  updatedAt: string;
};

export type CloudSyncState = {
  id: typeof cloudSyncStateId;
  /** ISO cursor: the newest updatedAt/deletedAt successfully pulled from the server. */
  lastSyncAt?: string;
  lastError?: string;
  updatedAt: string;
};

export type AppSetting = ReminderSyncState | AppearanceSettings | CloudSyncState;
