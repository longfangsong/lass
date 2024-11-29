"use client";

import { useWindowSize } from "@uidotdev/usehooks";
import { TableHeadCell } from "flowbite-react";

export default function WordTableButtonsHeader() {
  const { width } = useWindowSize();
  if (!width || width < 640) {
    return <TableHeadCell className="w-0 text-center">Controls</TableHeadCell>;
  } else {
    return (
      <>
        <TableHeadCell className="w-0 text-center">Play</TableHeadCell>
        <TableHeadCell className="w-0 text-center">Review</TableHeadCell>
        <TableHeadCell className="w-0 text-center">Done</TableHeadCell>
      </>
    );
  }
}
