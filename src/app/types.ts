import type {
  DBWord as GeneralDBWord,
  Word as GeneralWord,
  WordBookEntryWithDetails as GeneralWordBookEntryWithDetails,
} from "@/types";

export type DBWord = GeneralDBWord & { frequency_rank?: number };
export type Word = GeneralWord & { frequency_rank?: number };
export type WordBookEntryWithDetails = GeneralWordBookEntryWithDetails & {
  frequency_rank?: number;
};
