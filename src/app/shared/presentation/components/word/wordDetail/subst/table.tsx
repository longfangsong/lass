import type { Word } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";

const group1Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 1</span></TooltipTrigger>
    <TooltipContent>
        <p>This group contains en-words which ends with "-a".</p>
        <p>Böjningar: "-a" "-an" "-or" "-orna"</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group2Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 2</span></TooltipTrigger>
    <TooltipContent>
        <p>This group contains en-words which ends with consonant.</p>
        <p>Böjningar: "-" "-en" "-ar" "-arna"</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group2SyncopeTooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 2*</span></TooltipTrigger>
    <TooltipContent>
        <p>This is a sub group of Grupp 2, which the word ends with -el or -er.</p>
        <p>The "e" here or in added "-en" should be dropped.</p>
        <p>Böjningar: "-" "-n" "-ar"(remove e) "-arna"(remove e)</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group2ApocopeTooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 2*</span></TooltipTrigger>
    <TooltipContent>
        <p>This is a sub group of Grupp 2, which the en-word ends with -e.</p>
        <p>No need to add extra "e" in this case.</p>
        <p>Böjningar: "-" "-n" "-ar"(remove e) "-arna"(remove e)</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group3Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 3</span></TooltipTrigger>
    <TooltipContent>
        <p>This group contains mainly loan words.</p>
        <p>Böjningar: "-" "-en" "-er" "-erna"</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group3ApocopeTooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 3*</span></TooltipTrigger>
    <TooltipContent>
        <p>This is a sub group of Grupp 3, which the en-word ends with -e or -o.</p>
        <p>No need to add extra "e" in this case.</p>
        <p>Böjningar: "-" "-n" "-r" "-rna"</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group3UmlautTooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 3*</span></TooltipTrigger>
    <TooltipContent>
        <p>This is a sub group of Grupp 3, which the word undergoes umlaut (a to ä, o to ö) in plural forms.</p>
        <p>Böjningar: "-" "-en" "(with umlaut) -er" "(with umlaut) -erna"</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group4Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 4</span></TooltipTrigger>
    <TooltipContent>
        <p>This group contains mainly ett-words ending with a vowel.</p>
        <p>Böjningar: "-" "-t" "-n" "-na"</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group5Variant1Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 5</span></TooltipTrigger>
    <TooltipContent>
        <p>This group contains mainly ett-words ending with consonant.</p>
        <p>Böjningar: "-" "-et" "-" "-en"</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

const group5Variant2Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed">Grupp 5*</span></TooltipTrigger>
    <TooltipContent>
        <p>This is a sub group of Grupp 5, which the en-word ends with -are.</p>
        <p>Böjningar: "-" "-n" "-" "(remove e) -na"</p>
    </TooltipContent>
</Tooltip> substantiv.</p>;

export function Table({ word }: { word: Word }) {
    const obestSing = word?.indexes.find((it) => it.form === "obest.f.sing.");
    const bestSing = word?.indexes.find((it) => it.form === "best.f.sing.");
    const obestPl = word?.indexes.find((it) => it.form === "obest.f.pl.");
    const bestPl = word?.indexes.find((it) => it.form === "best.f.pl.");
    const anyRelevantForms = [obestSing, bestSing, obestPl, bestPl].some(Boolean);
    const isEttOrd = bestSing && bestSing.spell.endsWith("t");
    const group1Stem = obestSing && obestSing.spell.endsWith("a") && obestSing.spell.slice(0, -1);
    const isGroup1 = group1Stem && bestSing && obestPl && bestPl
        ? bestSing.spell === group1Stem + "an" &&
        obestPl.spell === group1Stem + "or" &&
        bestPl.spell === group1Stem + "orna"
        : false;
    const isGroup2 = obestSing && bestSing && obestPl && bestPl
        ? bestSing.spell === obestSing.spell + "en" &&
        obestPl.spell === obestSing.spell + "ar" &&
        bestPl.spell === obestSing.spell + "arna"
        : false;
    const group2ApocopedStem = obestSing && (obestSing.spell.endsWith("e") ? obestSing.spell.slice(0, -1) : null);
    const isGroup2Apocoped = group2ApocopedStem && bestSing && obestPl && bestPl
        ? bestSing.spell === group2ApocopedStem + "en" &&
        obestPl.spell === group2ApocopedStem + "ar" &&
        bestPl.spell === group2ApocopedStem + "arna"
        : false;
    const group2SyncopedStem = obestSing && obestSing.spell.includes("e")
        ? obestSing.spell.replace(/e(.)/, "$1")
        : null;
    const isGroup2Syncoped = group2SyncopedStem && bestSing && obestPl && bestPl
        ? bestSing.spell === obestSing?.spell + "n" &&
        obestPl.spell === group2SyncopedStem + "ar" &&
        bestPl.spell === group2SyncopedStem + "arna"
        : false;
    const isGroup3 = obestSing && bestSing && obestPl && bestPl
        ? bestSing.spell === obestSing.spell + "en" &&
        obestPl.spell === obestSing.spell + "er" &&
        bestPl.spell === obestSing.spell + "erna"
        : false;
    const isGroup3Apocope = obestSing && bestSing && obestPl && bestPl
        && (obestSing.spell.endsWith("e") || obestSing.spell.endsWith("o"))
        ? bestSing.spell === obestSing.spell + "n" &&
        obestPl.spell === obestSing.spell + "r" &&
        bestPl.spell === obestSing.spell + "rna"
        : false;


    const umlauted = obestSing?.spell.replace(/[ao](?!.*[ao])/, (match) => match === "a" ? "ä" : "ö");
    const isGroup3Umlaut = umlauted && bestSing && obestPl && bestPl
        ? bestSing.spell === obestSing?.spell + "en" &&
        obestPl.spell === umlauted + "er" &&
        bestPl.spell === umlauted + "erna"
        : false;

    const isGroup4 = obestSing && bestSing && obestPl && bestPl
        ? bestSing.spell === obestSing.spell + "t" &&
        obestPl.spell === obestSing.spell + "n" &&
        bestPl.spell === obestSing.spell + "na"
        : false;

    const isGroup5Variant1 = obestSing && bestSing && obestPl && bestPl
        ? bestSing.spell === (obestSing.spell.endsWith("e")
            ? obestSing.spell + "t"
            : obestSing.spell + "et") &&
        obestPl.spell === obestSing.spell &&
        bestPl.spell === (obestSing.spell.endsWith("e")
            ? obestSing.spell + "n"
            : obestSing.spell + "en")
        : false;
    const isGroup5Variant2 = obestSing && bestSing && obestPl && bestPl && obestSing.spell.endsWith("are")
        ? bestSing.spell === obestSing.spell + "n" &&
        obestPl.spell === obestSing.spell &&
        bestPl.spell === obestSing.spell.slice(0, -3) + "arna"
        : false;

    if (!anyRelevantForms) {
        return <></>;
    }

    return (
        <div className="max-w-full overflow-scroll">
            {isEttOrd ?
                <p>
                    &quot;{word.lemma}&quot; är ett{" "}
                    <b className="text-red-500">ett</b>-ord
                </p> :
                <p>
                    &quot;{word?.lemma}&quot; är ett{" "}
                    <b className="text-green-500">en</b>-ord
                </p>}
            {isGroup1 && group1Tooltip}
            {isGroup2 && group2Tooltip}
            {isGroup2Apocoped && group2ApocopeTooltip}
            {isGroup2Syncoped && group2SyncopeTooltip}
            {isGroup3 && group3Tooltip}
            {isGroup3Apocope && group3ApocopeTooltip}
            {isGroup3Umlaut && group3UmlautTooltip}
            {isGroup4 && group4Tooltip}
            {isGroup5Variant1 && group5Variant1Tooltip}
            {isGroup5Variant2 && group5Variant2Tooltip}
            {/* {isGroup5Variant3 && <p>Det här är ett Grupp 5* substantiv.</p>} */}
            <table className="py-1 px-2 border border-sky-500">
                <thead>
                    <tr>
                        <th />
                        <th className="py-1 px-2 border border-sky-500">Obestämd</th>
                        <th className="py-1 px-2 border border-sky-500">Bestämd</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-1 px-2 border border-sky-500">Singular</td>
                        <td className="py-1 px-2 border border-sky-500">
                            {word?.indexes.find((it) => it.form === "obest.f.sing.")?.spell}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {word?.indexes.find((it) => it.form === "best.f.sing.")?.spell}
                        </td>
                    </tr>
                    <tr>
                        <td className="py-1 px-2 border border-sky-500">Plural</td>
                        <td className="py-1 px-2 border border-sky-500">
                            {word?.indexes.find((it) => it.form === "obest.f.pl.")?.spell}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {word?.indexes.find((it) => it.form === "best.f.pl.")?.spell}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}