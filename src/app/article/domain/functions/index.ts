export function toWordsAndPunctuations(article: string): Array<Array<string>> {
  const wordsOrPunctuations = article
    .split(/(\s+)|(\.\.\.)|(\d+,\d+)|(\w+-\w+)|(\?!)|(\.)|([-",;?!])/)
    .filter((x) => x !== undefined)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  let result: Array<Array<string>> = [[]];
  let state: string | null = null;
  wordsOrPunctuations.forEach((wordOrPunctuation, index) => {
    if (wordOrPunctuation === '"') {
      if (state === "InSentence") {
        result[result.length - 1].push(wordOrPunctuation);
        result.push([]);
        state = null;
      } else {
        result[result.length - 1].push(wordOrPunctuation);
        state = "InSentence";
      }
    } else if (wordOrPunctuation === "-") {
      result.push([wordOrPunctuation]);
    } else if (
      (wordOrPunctuation === "..." ||
        wordOrPunctuation === "?!" ||
        wordOrPunctuation === "." ||
        wordOrPunctuation === "?" ||
        wordOrPunctuation === "!") &&
      index < wordsOrPunctuations.length &&
      wordsOrPunctuations[index + 1] !== '"'
    ) {
      result[result.length - 1].push(wordOrPunctuation);
      result.push([]);
      state = null;
    } else {
      result[result.length - 1].push(wordOrPunctuation);
    }
  });
  result = result.map((it) => it.filter((it) => it.trim().length > 0));
  return result.filter((it) => it.length > 0);
}
