export type AiProviderApi = "openai-chat" | "claude" | "gemini";

export type AiProviderDefinition = {
  label: string;
  defaultBaseUrl: string | null;
  defaultModel: string;
  api: AiProviderApi;
  keyHint: string;
};
