export interface MockLLMResponse {
  content: string;
  model?: string;
  finishReason?: "stop" | "length" | "error";
}

export const DEFAULT_MOCK_RESPONSE: MockLLMResponse = {
  content: "This is a mock LLM response.",
  model: "mock-model",
  finishReason: "stop",
};

export function createDelayedResponse(
  response: MockLLMResponse = DEFAULT_MOCK_RESPONSE,
  delayMs = 0
): Promise<MockLLMResponse> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(response), delayMs);
  });
}

export function createMockError(
  message = "Mock LLM error"
): Promise<never> {
  return Promise.reject(new Error(message));
}

export function createMockStreamChunks(chunks: string[]) {
  return chunks.map((content) => ({ content }));
}
