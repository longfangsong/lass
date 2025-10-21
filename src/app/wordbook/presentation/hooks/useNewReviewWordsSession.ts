import { useEffect, useMemo } from "react";
import { ReviewWordsSession } from "../../application/reviewWordsSession";
import { repository } from "../../infrastructure/repository";
import { useSettings } from "@/app/settings/presentation/hooks/useSettings";
import { useSyncService } from "@/app/sync/presentation/hooks";

/**
 * Hook that provides a stable ReviewWordsSession instance.
 * 
 * The session is initialized with the current user settings and repository.
 * The same session instance is returned across renders unless settings change.
 * 
 * @returns A ReviewWordsSession instance or null if settings are not loaded
 * 
 * @example
 * ```tsx
 * const session = useNewReviewWordsSession();
 * const nextWord = await session?.next();
 * ```
 */
export function useNewReviewWordsSession() {
    const { settings } = useSettings();
    const syncService = useSyncService();

    // Sync wordbook when component unmounts
    useEffect(() => {
        return () => { syncService.syncNow("WordBookEntry"); };
    }, [syncService]);

    // Create a stable session instance that only changes when settings change
    const session = useMemo(() => {
        if (!settings) {
            return null;
        }
        return new ReviewWordsSession(repository, settings);
    }, [settings]);

    return session;
}
