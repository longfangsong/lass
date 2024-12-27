"use client";

import { redirect } from "next/navigation";
import { WordBookPagination } from "./pagination";
import WordTable from "./table";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { SyncState, useOnline, useReviewProgressSyncState } from "@/lib/frontend/hooks";
import { MdDownloadDone, MdOutlineSync } from "react-icons/md";
import { IoCloudOfflineOutline } from "react-icons/io5";

export const runtime = "edge";

export default function WordBook({
  searchParams,
}: {
  searchParams?: { page?: number; fromPage?: string; snapshot?: number };
}) {
  const { status } = useSession();
  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/api/auth/signin");
    }
  }, [status]);

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
        page={searchParams?.page || 1}
        snapshot={searchParams?.snapshot || new Date().getTime()}
      />
      <WordBookPagination
        reviewProgressCount={reviewProgressCount}
        snapshotTime={searchParams?.snapshot || new Date().getTime()}
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
