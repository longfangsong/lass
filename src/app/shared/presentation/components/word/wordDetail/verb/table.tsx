import type { Word } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";

function isGroup1(infinitiv: string, presens: string, imperfekt: string, supinum: string, imperativ: string) {
    if (!infinitiv.endsWith("a")) {
        return false;
    }
    const stem = infinitiv.slice(0, -1);
    return presens === stem + "ar" &&
        imperfekt === stem + "ade" &&
        supinum === stem + "at" &&
        imperativ === infinitiv;
}

function isGroup2(infinitiv: string, presens: string, imperfekt: string, supinum: string, imperativ: string) {
    const stem = imperativ;
    return infinitiv === stem + "a" &&
        presens === stem + "er" &&
        imperfekt === stem + "de" &&
        supinum === stem + "t";
}

function isGroup2PKST(infinitiv: string, presens: string, imperfekt: string, supinum: string, imperativ: string) {
    const stem = imperativ;
    if (!stem.endsWith("k") && !stem.endsWith("p") && !stem.endsWith("s") && !stem.endsWith("t")) {
        return false;
    }
    return infinitiv === stem + "a" &&
        presens === stem + "er" &&
        imperfekt === stem + "te" &&
        supinum === stem + "t";
}

function isGroup3(infinitiv: string, presens: string, imperfekt: string, supinum: string, imperativ: string) {
    const stem = imperativ;
    return infinitiv === stem &&
        presens === stem + "r" &&
        imperfekt === stem + "dde" &&
        supinum === stem + "tt";
}

const group1Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed select-none">Grupp 1</span></TooltipTrigger>
    <TooltipContent>
        <p>This group contains verbs which presens end with "-ar".</p>
        <p>Böjningar: "-a" "-ar" "-ade" "-ad" "-at" "-a"</p>
    </TooltipContent>
</Tooltip> verb.</p>;

const group2Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed select-none">Grupp 2a</span></TooltipTrigger>
    <TooltipContent>
        <p>This group contains verbs which presens end with "-er", and consonant before it is NOT p, k, s, t or x..</p>
        <p>Böjningar: "-a" "-er" "-de" "-d" "-t" "-a"</p>
    </TooltipContent>
</Tooltip> verb.</p>;

const group2PKSTTooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed select-none">Grupp 2b</span></TooltipTrigger>
    <TooltipContent>
        <p>This is a sub group of Grupp 2, which presens end with "-er", and consonant before it is p, k, s, t or x.</p>
        <p>Böjningar: "-a" "-er" "-te" "-t" "-t" "-a"</p>
    </TooltipContent>
</Tooltip> verb.</p>;

const group3Tooltip = <p>Det här är ett <Tooltip>
    <TooltipTrigger asChild><span className="underline decoration-dashed select-none">Grupp 3</span></TooltipTrigger>
    <TooltipContent>
        <p>This group contains short verbs.</p>
        <p>Böjningar: "-" "-r" "-dde" "-dd" "-tt" "-"</p>
    </TooltipContent>
</Tooltip> verb.</p>;

export function Table({ word }: { word: Word }) {
    const imperativ = word.indexes.find((it) => it.form === "imperativ")?.spell;
    const infinitiv = word.indexes.find((it) => it.form === "infinitiv")?.spell;
    const imperfekt = word.indexes.find((it) => it.form === "imperfekt")?.spell;
    const supinum = word.indexes.find((it) => it.form === "supinum")?.spell;
    const perf_part = word.indexes.find((it) => it.form === "perf.part.")?.spell;
    const presens = word.indexes.find((it) => it.form === "presens")?.spell;
    const wordIsGroup1 = isGroup1(infinitiv || "", presens || "", imperfekt || "", supinum || "", imperativ || "");
    const wordOsGroup2 = isGroup2(infinitiv || "", presens || "", imperfekt || "", supinum || "", imperativ || "");
    const wordIsGroup2PKST = isGroup2PKST(infinitiv || "", presens || "", imperfekt || "", supinum || "", imperativ || "");
    const wordIsGroup3 = isGroup3(infinitiv || "", presens || "", imperfekt || "", supinum || "", imperativ || "");
    const anyRelevantForms = [
        imperativ,
        infinitiv,
        supinum,
        imperfekt,
        perf_part,
        presens,
    ].some((it) => it);
    if (!anyRelevantForms) {
        return <></>;
    }
    console.log({
        imperativ,
        infinitiv,
        supinum,
        imperfekt,
        perf_part,
        presens,
        wordIsGroup1,
        wordOsGroup2,
        wordIsGroup2PKST,
        wordIsGroup3,
    });
    return (
        <div className="max-w-full overflow-scroll">
            {wordIsGroup1 && group1Tooltip}
            {wordOsGroup2 && group2Tooltip}
            {wordIsGroup2PKST && group2PKSTTooltip}
            {wordIsGroup3 && group3Tooltip}
            <table className="py-1 px-2 border border-sky-500 max-w-72 overflow-scroll">
                <thead>
                    <tr>
                        <th className="py-1 px-2 border border-sky-500">Infinitiv</th>
                        <th className="py-1 px-2 border border-sky-500">Presens</th>
                        <th className="py-1 px-2 border border-sky-500">Imperfekt</th>
                        <th className="py-1 px-2 border border-sky-500">Supinum</th>
                        <th className="py-1 px-2 border border-sky-500">
                            Perfekt particip
                        </th>
                        <th className="py-1 px-2 border border-sky-500">Imperativ</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>          
                        <td className="py-1 px-2 border border-sky-500">
                            {infinitiv ? (
                                <>
                                    <span className="text-xs">att </span>
                                    {infinitiv}
                                </>
                            ) : (
                                <></>
                            )}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {presens ? presens : ""}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {imperfekt ? imperfekt : ""}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {supinum ? (
                                <>
                                    <span className="text-xs">har </span>
                                    {supinum}
                                </>
                            ) : (
                                <></>
                            )}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {perf_part ? (
                                <>
                                    <span className="text-xs">är </span>
                                    {perf_part}
                                </>
                            ) : (
                                <></>
                            )}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {imperativ ? <>{imperativ}!</> : <></>}
                        </td>

                    </tr>
                </tbody>
            </table>
        </div>
    );
}