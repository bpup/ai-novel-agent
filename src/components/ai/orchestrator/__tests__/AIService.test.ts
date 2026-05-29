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

describe("AIService", () => {
  let service: AIService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AIService();
  });

  describe("execute", () => {
    it("returns result with metadata", async () => {
      mockSendMessage.mockResolvedValueOnce("续写结果");

      const res = await service.execute("continue", "前面内容");

      expect(res.result).toBe("续写结果");
      expect(res.metadata).toBeDefined();
      expect(res.metadata!.command).toBe("continue");
      expect(res.metadata!.durationMs).toBeGreaterThanOrEqual(0);
    });

    it("calls chatService with correct arguments", async () => {
      mockSendMessage.mockResolvedValueOnce("ok");

      await service.execute("polish", "粗糙文字", "上下文内容");

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.stringContaining("润色"),
        [],
        "上下文内容",
      );
    });

    it("returns empty result for unknown command", async () => {
      const res = await service.execute("nonexistent", "text");

      expect(res.result).toBe("");
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("tracks duration in metadata", async () => {
      mockSendMessage.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("slow"), 50)),
      );

      const res = await service.execute("continue", "text");

      expect(res.metadata!.durationMs).toBeGreaterThanOrEqual(40);
    });

    it("handles LLM errors gracefully", async () => {
      mockSendMessage.mockRejectedValueOnce(new Error("LLM offline"));

      const res = await service.execute("continue", "text");

      expect(res.result).toBe("");
      expect(res.metadata).toBeDefined();
    });

    it("routes each command to correct prompt", async () => {
      mockSendMessage.mockResolvedValue("ok");

      await service.execute("expand", "短内容");
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.stringContaining("扩写"),
        [],
        undefined,
      );

      vi.clearAllMocks();
      mockSendMessage.mockResolvedValue("ok");

      await service.execute("summarize", "长内容");
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.stringContaining("总结"),
        [],
        undefined,
      );

      vi.clearAllMocks();
      mockSendMessage.mockResolvedValue("ok");

      await service.execute("fix_grammar", "有错别字");
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.stringContaining("错别字"),
        [],
        undefined,
      );
    });

    it("passes context to chatService", async () => {
      mockSendMessage.mockResolvedValue("ok");

      await service.execute("brainstorm", "新点子", "项目上下文");

      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.any(String),
        [],
        "项目上下文",
      );
    });
  });

  describe("executeStream", () => {
    it("yields tokens from chatService", async () => {
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

    it("handles unknown command gracefully (no yield)", async () => {
      const tokens: string[] = [];
      for await (const token of service.executeStream("unknown", "text")) {
        tokens.push(token);
      }

      expect(tokens).toEqual([]);
    });

    it("handles stream error gracefully", async () => {
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
        // Expected from the broken generator
      }

      expect(tokens).toContain("partial");
    });
  });
});
