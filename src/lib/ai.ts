import {
  GenerativeModel,
  GoogleGenerativeAI,
  ResponseSchema,
  SchemaType,
} from "@google/generative-ai";

let cachedModel: GenerativeModel | undefined;

export function dictionaryModel(apiToken: string): GenerativeModel {
  if (cachedModel) return cachedModel;
  const accountId = "ba6c3ee6481f83e9ced0460cb55a4ade";
  const gatewayName = "swedish-teacher";
  const genAI = new GoogleGenerativeAI(apiToken);

  const wordSchema: ResponseSchema = {
    type: SchemaType.OBJECT,
    properties: {
      spell: { type: SchemaType.STRING },
      pronunciation: { type: SchemaType.STRING },
      part_of_speech: {
        type: SchemaType.STRING,
        enum: [
          "adv.",
          "pron.",
          "adj.",
          "konj.",
          "subst.",
          "noun.",
          "prep.",
          "verb",
        ],
      },
      meaning: { type: SchemaType.STRING },
      example_sentence: { type: SchemaType.STRING },
      example_sentence_meaning: { type: SchemaType.STRING },
    },
    required: ["spell", "pronunciation", "part_of_speech", "meaning"],
  };
  cachedModel = genAI.getGenerativeModel(
    {
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: wordSchema,
      },
    },
    {
      baseUrl: `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayName}/google-ai-studio`,
    },
  );
  return cachedModel;
}
