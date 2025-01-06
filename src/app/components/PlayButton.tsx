import { Button } from "flowbite-react";
import { RiUserVoiceLine } from "react-icons/ri";

export default function PlayButton({
  voice,
  className,
}: {
  className?: string;
  voice: { phonetic_url: string | null; phonetic_voice: Array<number> | null };
}) {
  return (
    <Button
      aria-label="Play pronunciation"
      disabled={voice.phonetic_url === null && voice.phonetic_voice === null}
      className={"p-0 " + (className || "")}
      onClick={() => {
        if (voice.phonetic_url) {
          new Audio(voice.phonetic_url).play();
        } else if (voice.phonetic_voice) {
          const pronunciation_voice = new Uint8Array(voice.phonetic_voice);
          const blob = new Blob([pronunciation_voice], { type: "audio/mp3" });
          new Audio(window.URL.createObjectURL(blob)).play();
        }
      }}
    >
      <RiUserVoiceLine className="h-4 w-4" />
    </Button>
  );
}
