import type { Word } from "@/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip";

export function PronCountTable({ word }: { word: Word }) {
    const relevantForms = ["nform", "tform", "aform"];
    const anyRelevantForms = relevantForms.some((form) =>
        word?.indexes.find((it) => it.form === form),
    );
    if (!anyRelevantForms) {
        return <></>;
    }
    const nForm = word?.indexes.find((it) => it.form === "nform")?.spell;
    const tForm = word?.indexes.find((it) => it.form === "tform")?.spell;
    const aForm = word?.indexes.find((it) => it.form === "aform")?.spell;
    return (
        <div className="max-w-full overflow-scroll">
            <h4 className="scroll-m-20 text-l font-semibold tracking-tigh">Grammatical number & case</h4>
            <table className="py-1 px-2 border border-sky-500 max-w-72 overflow-scroll">
                <thead>
                    <tr>
                        <th className="py-1 px-2 border border-sky-500">
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">n-form</TooltipTrigger>
                                <TooltipContent className="w-80">
                                    Use with indefinite singular en-word
                                </TooltipContent>
                            </Tooltip>
                        </th>
                        <th className="py-1 px-2 border border-sky-500">
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">t-form</TooltipTrigger>
                                <TooltipContent className="w-80">
                                    Use with indefinite singular ett-word
                                </TooltipContent>
                            </Tooltip>
                        </th>
                        <th className="py-1 px-2 border border-sky-500">
                            <Tooltip>
                                <TooltipTrigger className="cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800">a-form</TooltipTrigger>
                                <TooltipContent className="w-80">
                                    Use with plural or definite nouns
                                </TooltipContent>
                            </Tooltip>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="py-1 px-2 border border-sky-500">
                            {nForm && <><span className="text-xs">en</span>&nbsp;{nForm} <span className="text-xs">...</span></>}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {tForm && <><span className="text-xs">ett</span>&nbsp;{tForm} <span className="text-xs">...</span></>}
                        </td>
                        <td className="py-1 px-2 border border-sky-500">
                            {aForm && <><span className="text-xs">den</span>&nbsp;{aForm} <span className="text-xs">...</span></>}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}