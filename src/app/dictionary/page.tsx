"use client";

import { Word, WordSearchResult } from "@/lib/types";
import debounce from "debounce";
import {
  FloatingLabel,
  HR,
  Modal,
  ModalBody,
  ModalHeader,
  Table,
  TableCell,
} from "flowbite-react";
import React, { useState } from "react";
import { WordDetail } from "../_components/WordDetail";
import { SaveToWordBookButton } from "../_components/SaveToWordBook";
import { useSession } from "next-auth/react";
import { MdDownloadDone, MdOutlineSync } from "react-icons/md";
import { IoCloudOfflineOutline } from "react-icons/io5";
import { SyncState, useDictionarySyncState, useOnline } from "@/lib/frontend/hooks";

export const runtime = "edge";

function WordDetailModal({
  word,
  onClose,
}: {
  word: Word | null;
  onClose?: () => void;
}) {
  const { status } = useSession();
  return (
    <Modal show={word !== null} onClose={onClose}>
      <ModalHeader>{word?.lemma}</ModalHeader>
      <ModalBody className="p-4">
        <WordDetail
          word={word}
          buttons={
            status === "authenticated" && word
              ? [<SaveToWordBookButton key={`save-${word.id}`} word_id={word.id} className="ml-3" />]
              : []
          }
        />
      </ModalBody>
    </Modal>
  );
}

export default function Words() {
  const [words, setWords] = useState<Array<WordSearchResult>>([]);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const online = useOnline();
  const syncState = useDictionarySyncState();
  const search = debounce((e) => {
    (async () => {
      const { localFirstDataSource } = await import(
        "@/lib/frontend/datasource/localFirst"
      );
      if (e.target.value === "") {
        setWords([]);
        return;
      }
      const result = await localFirstDataSource.searchWord(e.target.value);
      setWords(result);
    })();
  }, 500);
  return (
    <div>
      <FloatingLabel
        variant="filled"
        label="Search"
        onKeyDown={search}
        onChange={search}
      />
      <Table>
        <Table.Head>
          <Table.HeadCell>Spell</Table.HeadCell>
          <Table.HeadCell>Definitions</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {words.map((word) => (
            <Table.Row
              key={word.id}
              onClick={async () => {
                const { localFirstDataSource } = await import(
                  "@/lib/frontend/datasource/localFirst"
                );
                const result = await localFirstDataSource.getWord(word.id);
                setSelectedWord(result);
              }}
            >
              <TableCell className="py-1">{word.lemma}</TableCell>
              <TableCell className="py-1">
                {word.definitions.map((definition, index) => (
                  <React.Fragment key={`${word.id}-${definition}-${index}`}>
                    <p>{definition}</p>
                    {index !== word.definitions.length - 1 ? (
                      <HR className="m-1" />
                    ) : (
                      <></>
                    )}
                  </React.Fragment>
                ))}
              </TableCell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <WordDetailModal
        word={selectedWord}
        onClose={() => setSelectedWord(null)}
      />
      {!online ? (
        <>
          <div className="flex flex-row items-center justify-center mt-4">
            <IoCloudOfflineOutline className="w-6 h-6" />
            <div className="ml-2">
              <p>Cannot connect to the server</p>
              <p className="text-xs">
                Your search will be handled on your device.
              </p>
            </div>
          </div>
        </>
      ) : syncState === SyncState.Syncing ? (
        <div className="flex flex-row items-center justify-center mt-4">
          <MdOutlineSync className="animate-spin w-6 h-6" />
          <div className="ml-2">
            <p>Downloading dictionary to your device...</p>
            <p className="text-xs">Your search will be handled on server.</p>
          </div>
        </div>
      ) : syncState === SyncState.Synced ? (
        <div className="flex flex-row items-center justify-center mt-4">
          <MdDownloadDone className="w-6 h-6" />
          <div className="ml-2">
            <p>Dictionary downloaded.</p>
            <p className="text-xs">
              Your search will be handled on your device.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <p>{online}</p>
          <p>Unknown sync state: {syncState}</p>
        </div>
      )}
    </div>
  );
}
