import type { Repository } from "@/app/domain/repository/wordbookEntry";
import type { WordBookEntry } from "@/types";
import { groupByProp } from "remeda";

export async function aggregate(
  repository: Repository,
): Promise<Partial<Record<number, WordBookEntry[]>>> {
  const entries = await repository.all;
  return groupByProp(entries, "passive_review_count");
}
