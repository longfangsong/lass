import { fetchWithSemaphore } from "@/lib/fetch";
import { ReviewProgressPatchPayload } from "@/lib/types";

export async function patch(id: string, payload: ReviewProgressPatchPayload) {
  fetchWithSemaphore(`/api/review_progresses/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}
