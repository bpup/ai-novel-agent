import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIService } from "../AIService";

vi.mock("../../../../services/llm/chat", () => ({
  chatService: {
    sendMessage: vi.fn(),
    streamMessage: vi.fn(),
  },
}));

import { chatService } from "../../../../services/llm/chat";

const mockSendMessage = vi.mocked(chatService.sendMessage);
const mockStreamMessage = vi.mocked(chatService.streamMessage);

const ALL_COMMANDS = [
  "continue",
  "expand",
  "summarize",
  "polish",
  "rewrite_tone",
  "fix_grammar",
  "extract_keywords",
  "auto_paragraph",
  "generate_title",
  "add_description",
  "translate",
  "brainstorm",
  "generate_outline",
] as const;

describe("AIService Integration", () => {
  let service: AIService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AIService();
  });

  describe("execute — all 13 commands", () => {
    ALL_COMMANDS.forEach((command) => {
      it(`${command}: calls chatService with prompt and returns result`, async () => {
        mockSendMessage.mockResolvedValueOnce(`response for ${command}`);

        const res = await service.execute(command, "test input");

        expect(res.result).toBe(`response for ${command}`);
        expect(res.metadata).toBeDefined();
        expect(res.metadata!.command).toBe(command);
        expect(res.metadata!.durationMs).toBeGreaterThanOrEqual(0);
        expect(mockSendMessage).toHaveBeenCalledTimes(1);
      });
    });

    it("passes context string to chatService", async () => {
      mockSendMessage.mockResolvedValueOnce("ok");

      await service.execute("continue", "input", "project context");

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(String),
        [],
        "project context",
      );
    });

    it("passes undefined context when not provided", async () => {
      mockSendMessage.mockResolvedValueOnce("ok");

      await service.execute("continue", "input");

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(String),
        [],
        undefined,
      );
    });
  });

  describe("execute — unknown command", () => {
    it("returns empty result without calling chatService", async () => {
      const res = await service.execute("nonexistent", "text");

      expect(res.result).toBe("");
      expect(res.metadata).toBeDefined();
      expect(res.metadata!.command).toBe("nonexistent");
      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe("execute — error recovery", () => {
    it("returns empty result when chatService rejects", async () => {
      mockSendMessage.mockRejectedValueOnce(new Error("Network error"));

      const res = await service.execute("continue", "text");

      expect(res.result).toBe("");
      expect(res.metadata).toBeDefined();
      expect(res.metadata!.command).toBe("continue");
      expect(res.metadata!.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("does not throw on LLM failure", async () => {
      mockSendMessage.mockRejectedValueOnce(new Error("API key missing"));

      await expect(service.execute("polish", "text")).resolves.toBeDefined();
    });
  });

  describe("executeStream", () => {
    it("yields all tokens from chatService", async () => {
      mockStreamMessage.mockReturnValue(
        (async function* () {
          yield "Hello";
          yield " ";
          yield "World";
        })(),
      );

      const tokens: string[] = [];
      for await (const token of service.executeStream("continue", "text")) {
        tokens.push(token);
      }

      expect(tokens).toEqual(["Hello", " ", "World"]);
    });

    it("yields nothing for unknown command", async () => {
      const tokens: string[] = [];
      for await (const token of service.executeStream("unknown", "text")) {
        tokens.push(token);
      }

      expect(tokens).toEqual([]);
    });

    it("yields partial tokens before stream error", async () => {
      mockStreamMessage.mockReturnValue(
        (async function* () {
          yield "partial";
          throw new Error("Connection lost");
        })(),
      );

      const tokens: string[] = [];
      try {
        for await (const token of service.executeStream("continue", "text")) {
          tokens.push(token);
        }
      } catch {
      }

      expect(tokens).toContain("partial");
    });

    it("passes context to streamMessage", async () => {
      mockStreamMessage.mockReturnValue(
        (async function* () {
          yield "ok";
        })(),
      );

      for await (const _ of service.executeStream("continue", "text", "ctx")) {
      }

      expect(mockStreamMessage).toHaveBeenCalledWith(
        expect.any(String),
        [],
        "ctx",
      );
    });

    it("respects executeStream on known command without crashing", async () => {
      mockStreamMessage.mockReturnValue(
        (async function* () {
          yield "one";
          yield "two";
        })(),
      );

      const tokens: string[] = [];
      for await (const token of service.executeStream("brainstorm", "topic")) {
        tokens.push(token);
      }

      expect(tokens).toEqual(["one", "two"]);
    });
  });

  describe("metadata tracking", () => {
    it("records accurate duration", async () => {
      mockSendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("slow"), 60)),
      );

      const res = await service.execute("continue", "text");

      expect(res.metadata!.durationMs).toBeGreaterThanOrEqual(50);
    });
  });
});
