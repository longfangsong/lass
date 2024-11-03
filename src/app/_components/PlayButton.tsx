"use client";

import { Button } from "flowbite-react";
import { RiUserVoiceLine } from "react-icons/ri";

export function PlayButton({
  voice,
  className,
}: {
  className?: string;
  voice: { phonetic_url: string | null };
}) {
  return (
    <Button
      className={"p-0 " + className ? className : ""}
      onClick={() => {
        if (voice.phonetic_url) {
          new Audio(voice.phonetic_url).play();
        }
      }}
    >
      <RiUserVoiceLine className="h-4 w-4" />
    </Button>
  );
}
