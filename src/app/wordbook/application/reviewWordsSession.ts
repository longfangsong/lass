import { AutoNewReviewPolicy, type Word, type WordBookEntry, type WordBookEntryWithDetails } from "@/types";
import type { Repository } from "../domain/repository";
import { getWordBookEntryDetail } from "./getDetails";
import { wordTable } from "../infrastructure/repository";
import { getPicker } from "./autoReview";
import { passiveReviewsStartedOrWillStartToday, remainingNeedPassiveReviewToday } from "./reviewStats";
import { startPassiveReviewProgress } from "./startReview";
import type { Settings } from "@/app/settings/domain/model";

export interface ToReview {
    mode: "passive" | "active";
    entry: WordBookEntryWithDetails;
}

export class ReviewWordsSession {
    private toReview: Array<ToReview> = [];
    private currentIndex: number = 0;

    constructor(
        private repository: Repository,
        private settings: Settings,
        private getDetail: (entry: WordBookEntry) => Promise<WordBookEntryWithDetails> = getWordBookEntryDetail,
        private bulkGetWord: (ids: Array<string>) => Promise<Array<Word | undefined>> = wordTable.bulkGet.bind(wordTable),
    ) {
    }

    private async autoReplenishPassiveReviews(
        autoNewReviewPolicy: AutoNewReviewPolicy,
        maxReviewPerDay: number
    ): Promise<Array<WordBookEntryWithDetails>> {
        // If user has disabled auto new reviews, don't replenish
        if (autoNewReviewPolicy === AutoNewReviewPolicy.No) {
            return [];
        }

        const allEntries = await this.repository.all;
        const currentStartedToday = passiveReviewsStartedOrWillStartToday(allEntries);
        const waitingForReview = remainingNeedPassiveReviewToday(allEntries);
        if (
            currentStartedToday.length + waitingForReview.length <
            maxReviewPerDay
        ) {
            const needToStart =
                maxReviewPerDay - currentStartedToday.length - waitingForReview.length;
            const notStartedEntries = await this.repository.reviewNotStarted();

            if (notStartedEntries.length > 0) {
                // Use user's configured policy to pick new entries to start
                const picker = getPicker(this.bulkGetWord)(autoNewReviewPolicy);
                const toStart = await picker(notStartedEntries, needToStart);

                // Start passive review for selected entries
                await Promise.all(
                    toStart.map((entry) => startPassiveReviewProgress(this.repository, entry)),
                );

                const newToStart = await this.repository.needPassiveReviewNow();
                // Get details for newly started reviews
                const newDetails = await Promise.all(
                    newToStart.map((entry) => this.getDetail(entry)),
                );
                return newDetails;
            }
        }
        return [];
    }

    public async next(): Promise<ToReview | null> {
        if (this.toReview.length === 0) {
            const passiveEntries = await this.repository.needPassiveReviewNow();
            const passiveDetails = await Promise.all(
                passiveEntries.map((entry) => this.getDetail(entry)),
            );
            passiveDetails.forEach((detail) => {
                this.toReview.push({ mode: "passive", entry: detail });
            });

            const activeEntries = await this.repository.needActiveReviewNow();
            const activeDetails = await Promise.all(
                activeEntries.map((entry) => this.getDetail(entry)),
            );
            activeDetails.forEach((detail) => {
                this.toReview.push({ mode: "active", entry: detail });
            });
        } 
        if (this.currentIndex >= this.toReview.length) {
            const newPassiveReviews = await this.autoReplenishPassiveReviews(
                this.settings?.auto_new_review ?? AutoNewReviewPolicy.No,
                this.settings?.daily_new_review_count ?? 20
            );
            this.toReview.push(...newPassiveReviews.map((detail) => ({ mode: "passive" as const, entry: detail })));
        }
        if (this.currentIndex < this.toReview.length) {
            const review = this.toReview[this.currentIndex];
            this.currentIndex += 1;
            return review;
        }
        return null;
    }
}