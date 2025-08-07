import { AudioLines } from "lucide-react";
import { cn } from "@app/presentation/lib/utils";
import { Button } from "./ui/button";
import type { WithPhonetic } from "@/types";
export default function PlayButton({
  voice,
  className,
}: {
  className?: string;
  voice: WithPhonetic;
}) {
  return (
    <Button
      aria-label="Play pronunciation"
      disabled={voice.phonetic_url === null && voice.phonetic_voice === null}
      className={cn("p-0", className)}
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
      <AudioLines className="h-4 w-4" />
    </Button>
  );
}
