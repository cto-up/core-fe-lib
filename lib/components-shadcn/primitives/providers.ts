export const providers = [
  "OPENAI",
  "MISTRAL",
  "GOOGLEAI",
  "ANTHROPIC",
  "OLLAMA",
];

export const providerModels = {
  OPENAI: [
    "gpt-3.5-turbo",
    "gpt-3.5-turbo-16k",
    "gpt-4",
    "gpt-4-turbo",
    "gpt-4o",
    "gpt-4o-mini",
  ],
  MISTRAL: [
    "mistral-small",
    "mistral-medium",
    "mistral-large",
    "mistral-saba-latest",
    "mistral-8x7b",
    "mistral-8x22b",
    "mixtral-8x7b-instruct",
    "mixtral-8x22b-instruct",
  ],
  GOOGLEAI: ["gemini-1.5-flash", "gemini-2.5-flash", "gemini-2.5-pro"],
  ANTHROPIC: [
    "claude-3-haiku-20240307",
    "claude-3-sonnet-20240229",
    "claude-3-opus-20240229",
    "claude-3.5-sonnet-20240620",
    "claude-3.5-haiku-20240307",
    "claude-3.7-sonnet-20250219",
  ],
  OLLAMA: ["llama2", "mistral", "codellama", "mixtral"],
} as const;
