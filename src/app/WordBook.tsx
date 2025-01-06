import { useEffect, useState } from "react";
import WordTable from "@/app/word_book/WordTable";
import WordBookPagination from "@/app/word_book/WordBookPagination";
import {
  SyncState,
  useOnline,
  useReviewProgressSyncState,
} from "@/lib/frontend/hooks";
import { MdDownloadDone, MdOutlineSync } from "react-icons/md";
import { IoCloudOfflineOutline } from "react-icons/io5";
import { useAuth } from "./hooks/useAuth";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router";

export const runtime = "edge";

export default function WordBook() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/api/auth/github/login");
    }
  }, [loading, user, navigate]);

  const page = parseInt(searchParams.get("page") || "1");
  const snapshot = parseInt(searchParams.get("snapshot") || new Date().getTime().toString());

  const [reviewProgressCount, setReviewProgressCount] = useState(0);
  const reviewProgressSyncState = useReviewProgressSyncState();
  const online = useOnline();
  useEffect(() => {
    (async () => {
      const { localFirstDataSource } = await import(
        "@/lib/frontend/datasource/localFirst"
      );
      const count = await localFirstDataSource.getReviewProgressCount();
      setReviewProgressCount(count);
    })();
  });
  return (
    <div>
      <WordTable
        page={page}
        snapshot={snapshot}
      />
      <WordBookPagination
        reviewProgressCount={reviewProgressCount}
        snapshotTime={snapshot}
      />
      {!online && (
        <div className="flex flex-row items-center justify-center mt-4">
          <IoCloudOfflineOutline className="w-6 h-6" />
          <div className="ml-2">
            <p>You are offline.</p>
            <p className="text-xs">
              Your review will be handled on your device.
            </p>
          </div>
        </div>
      )}
      {online && reviewProgressSyncState === SyncState.Syncing && (
        <div className="flex flex-row items-center justify-center mt-4">
          <MdOutlineSync className="animate-spin w-6 h-6" />
          <div className="ml-2">
            <p>Syncing review progress...</p>
            <p className="text-xs">
              Your review will be handled on your device.
            </p>
          </div>
        </div>
      )}
      {online && reviewProgressSyncState === SyncState.Synced && (
        <div className="flex flex-row items-center justify-center mt-4">
          <MdDownloadDone className="w-6 h-6" />
          <div className="ml-2">
            <p>Review progress synced.</p>
            <p className="text-xs">
              Your review will be handled on your device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
