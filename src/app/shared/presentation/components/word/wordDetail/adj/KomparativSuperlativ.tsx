import type { Word } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";
import { Separator } from "../../../ui/separator";

function KomparativSuperlativIndicator({ word }: { word: Word }) {
    const isRegular =
        word?.indexes.find((it) => it.form === "komparativ")?.spell ===
        word.lemma + "are" &&
        word?.indexes.find((it) => it.form === "superlativ")?.spell ===
        word.lemma + "ast" &&
        word?.indexes.find((it) => it.form === "superlativ_b")?.spell ===
        word.lemma + "aste";

    const match = word.lemma.match(/(.+)e(.)/);
    const isVowelDropRegular =
        match &&
        word?.indexes.find((it) => it.form === "komparativ")?.spell ===
        match[1] + match[2] + "are" &&
        word?.indexes.find((it) => it.form === "superlativ")?.spell ===
        match[1] + match[2] + "ast" &&
        word?.indexes.find((it) => it.form === "superlativ_b")?.spell ===
        match[1] + match[2] + "aste";

    if (isRegular) {
        return <Tooltip>
            <TooltipTrigger className="cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900">Regelbundna</TooltipTrigger>
            <TooltipContent className="w-80">
                Regular change pattern:
                <ul className="list-disc ml-4">
                    <li>Komparativ: grundform + "are"</li>
                    <li>Superlativ: grundform + "ast"</li>
                </ul>
            </TooltipContent>
        </Tooltip>;
    }
    if (isVowelDropRegular) {
        return <Tooltip>
            <TooltipTrigger className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">e-förlust</TooltipTrigger>
            <TooltipContent className="w-80">
                The adjective ends with the pattern "{`-e${match[2]}`}",
                the "e" is dropped before adding "-are" or "-ast".
            </TooltipContent>
        </Tooltip>;
    }
    return <Tooltip>
        <TooltipTrigger className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">Oregelbundna</TooltipTrigger>
        <TooltipContent className="w-80">Irregular change 💩</TooltipContent>
    </Tooltip>;
}

export function KomparativSuperlativTable({word}: {word: Word}) {
  const relevantForms = ["komparativ", "superlativ", "superlativ_b"];
  const anyRelevantForms = relevantForms.some((form) =>
    word?.indexes.find((it) => it.form === form),
  );
  if (!anyRelevantForms) {
    return <></>;
  }
  return (
    <div className="max-w-full overflow-scroll">
      <Separator className="my-1 border" />
      <h4 className="scroll-m-20 text-l font-semibold tracking-tigh">Komparativ & Superlativ</h4>
      <KomparativSuperlativIndicator word={word} />
      <table className="py-1 px-2 border border-sky-500 max-w-72 overflow-scroll">
        <thead>
          <tr>
            <th className="py-1 px-2 border border-sky-500">komparativ</th>
            <th className="py-1 px-2 border border-sky-500">Obestämd superlativ</th>
            <th className="py-1 px-2 border border-sky-500">Bestämd superlativ</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-1 px-2 border border-sky-500">
              <span className="text-xs">en/ett/den/det/de</span>&nbsp;{word?.indexes.find((it) => it.form === "komparativ")?.spell} <span className="text-xs">...</span>
            </td>
            <td className="py-1 px-2 border border-sky-500">
              <span className="text-xs">...</span>&nbsp;<span className="text-xs">är</span>&nbsp;{word?.indexes.find((it) => it.form === "superlativ")?.spell}
            </td>
            <td className="py-1 px-2 border border-sky-500">
              <span className="text-xs">den/det/de</span>&nbsp;{word?.indexes.find((it) => it.form === "superlativ_b")?.spell}<span className="text-xs">...</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
