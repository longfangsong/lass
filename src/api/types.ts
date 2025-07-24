import type { WordBookEntry as ClientSideWordBookEntry } from "@/types";

export type WordBookEntry = ClientSideWordBookEntry & { user_email: string };
