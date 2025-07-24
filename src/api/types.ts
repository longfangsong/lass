import type {
  WordBookEntry as ClientSideWordBookEntry,
  UserSettings as ClientSideUserSettings,
} from "@/types";

export type WordBookEntry = ClientSideWordBookEntry & { user_email: string };
export type UserSettings = ClientSideUserSettings & { user_email: string };
