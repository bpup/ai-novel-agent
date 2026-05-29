import { describe, it, expect } from "vitest";
import {
  continueWriting,
  expandWriting,
  summarizeText,
  polishText,
  rewriteTone,
  fixGrammar,
  extractKeywords,
  autoParagraph,
  generateTitle,
  addDescription,
  translateText,
  brainstormIdeas,
} from "../prompts";

const SAMPLE = "夜幕降临，小镇陷入了沉寂。";

describe("continueWriting", () => {
  it("returns a non-empty prompt", () => {
    const p = continueWriting(SAMPLE);
    expect(p).toContain("续写");
    expect(p).toContain(SAMPLE);
    expect(p.length).toBeGreaterThan(0);
  });

  it("handles empty context", () => {
    const p = continueWriting("");
    expect(p).toContain("续写");
  });
});

describe("expandWriting", () => {
  it("returns a non-empty prompt", () => {
    const p = expandWriting(SAMPLE);
    expect(p).toContain("扩写");
    expect(p).toContain(SAMPLE);
  });

  it("handles long input", () => {
    const long = "A".repeat(10000);
    const p = expandWriting(long);
    expect(p).toContain("扩写");
    expect(p).toContain(long);
  });
});

describe("summarizeText", () => {
  it("returns a non-empty prompt", () => {
    const p = summarizeText(SAMPLE);
    expect(p).toContain("总结");
    expect(p).toContain(SAMPLE);
  });
});

describe("polishText", () => {
  it("returns a non-empty prompt", () => {
    const p = polishText(SAMPLE);
    expect(p).toContain("润色");
    expect(p).toContain(SAMPLE);
  });
});

describe("rewriteTone", () => {
  it("default tone is formal", () => {
    const p = rewriteTone(SAMPLE);
    expect(p).toContain("正式");
    expect(p).toContain(SAMPLE);
  });

  it("supports literary tone", () => {
    const p = rewriteTone(SAMPLE, "literary");
    expect(p).toContain("文学");
  });

  it("supports casual tone", () => {
    const p = rewriteTone(SAMPLE, "casual");
    expect(p).toContain("轻松");
  });

  it("supports urgent tone", () => {
    const p = rewriteTone(SAMPLE, "urgent");
    expect(p).toContain("紧张");
  });

  it("falls back to formal for unknown tone", () => {
    const p = rewriteTone(SAMPLE, "unknown_tone");
    expect(p).toContain("正式");
  });
});

describe("fixGrammar", () => {
  it("returns a non-empty prompt", () => {
    const p = fixGrammar(SAMPLE);
    expect(p).toContain("错别字");
    expect(p).toContain(SAMPLE);
  });
});

describe("extractKeywords", () => {
  it("returns a non-empty prompt", () => {
    const p = extractKeywords(SAMPLE);
    expect(p).toContain("提取");
    expect(p).toContain(SAMPLE);
    expect(p).toContain("人物");
  });
});

describe("autoParagraph", () => {
  it("returns a non-empty prompt", () => {
    const p = autoParagraph(SAMPLE);
    expect(p).toContain("分段");
    expect(p).toContain(SAMPLE);
  });
});

describe("generateTitle", () => {
  it("returns a non-empty prompt", () => {
    const p = generateTitle(SAMPLE);
    expect(p).toContain("标题");
    expect(p).toContain(SAMPLE);
    expect(p).toContain("3-5");
  });
});

describe("addDescription", () => {
  it("returns a non-empty prompt", () => {
    const p = addDescription(SAMPLE);
    expect(p).toContain("描写");
    expect(p).toContain(SAMPLE);
  });
});

describe("translateText", () => {
  it("defaults to English", () => {
    const p = translateText(SAMPLE);
    expect(p).toContain("English");
    expect(p).toContain(SAMPLE);
  });

  it("supports custom target language", () => {
    const p = translateText(SAMPLE, "日本語");
    expect(p).toContain("日本語");
  });
});

describe("brainstormIdeas", () => {
  it("returns a non-empty prompt", () => {
    const p = brainstormIdeas("时间旅行");
    expect(p).toContain("头脑风暴");
    expect(p).toContain("时间旅行");
    expect(p).toContain("3-5");
  });
});
