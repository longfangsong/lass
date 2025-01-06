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
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router";
import { useSearchParams } from "react-router";
import { localFirstDataSource } from "@/lib/frontend/datasource/localFirst";

export default function WordBook() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth/login");
    }
  }, [loading, user, navigate]);

  if (searchParams.get("page") === null && searchParams.get("snapshot") === null) {
    navigate(`/word_book?page=1&snapshot=${new Date().getTime()}`);
  }

  const page = parseInt(searchParams.get("page")!);
  const snapshot = parseInt(searchParams.get("snapshot")!);

  const [reviewProgressCount, setReviewProgressCount] = useState(0);
  const reviewProgressSyncState = useReviewProgressSyncState();
  const online = useOnline();
  useEffect(() => {
    (async () => {
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
