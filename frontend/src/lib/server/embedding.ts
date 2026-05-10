type AiBinding = {
  run: (model: string, inputs: { text: string | string[] }) => Promise<{ data: number[][] }>;
};

export const generateEmbedding = async (
  ai: AiBinding | undefined,
  text: string,
): Promise<number[] | null> => {
  if (!ai) return null;

  try {
    const result = await ai.run('@cf/baai/bge-m3', { text: [text] });
    return result.data[0] ?? null;
  } catch {
    return null;
  }
};
