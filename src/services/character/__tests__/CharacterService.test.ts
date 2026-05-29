import { describe, it, expect, beforeEach, vi } from "vitest";
import { CharacterService } from "../service";

vi.mock("../../db/database", () => {
  const store: Record<string, any[]> = {};
  return {
    runQuery: vi.fn(async (_sql: string, params?: unknown[]) => {
      const sqlLc = _sql.toLowerCase();
      const p = (params ?? []) as string[];
      if (sqlLc.startsWith("insert")) {
        const [id, projectId, name, description, traitsJson] = p;
        if (!store[projectId]) store[projectId] = [];
        store[projectId].push({ id, projectId, name, description, traits: JSON.parse(traitsJson ?? "[]") });
      } else if (sqlLc.startsWith("delete")) {
        const targetId = p[0];
        for (const key of Object.keys(store)) {
          store[key] = store[key].filter((r: any) => r.id !== targetId);
        }
      } else if (sqlLc.startsWith("update")) {
        const targetId = p[p.length - 1];
        for (const key of Object.keys(store)) {
          const idx = store[key].findIndex((r: any) => r.id === targetId);
          if (idx !== -1) {
            store[key][idx].name = p[0];
            if (p.length >= 3) {
              try { store[key][idx].traits = JSON.parse(p[1]); } catch { /* not traits field */ }
            }
          }
        }
      }
    }),
    getRows: vi.fn(async (_sql: string, params?: unknown[]) => {
      const projectId = ((params ?? []) as string[])[0] ?? "";
      const rows = store[projectId] ?? [];
      return rows.map((r: any) => ({ ...r, traits: JSON.stringify(r.traits) }));
    }),
  };
});

describe("CharacterService", () => {
  const svc = new CharacterService();
  let projectId: string;

  beforeEach(() => {
    projectId = `test-${Date.now()}`;
  });

  it("should create a character with name and optional fields", async () => {
    const char = await svc.createCharacter(projectId, {
      name: "Alice",
      description: "Main protagonist",
      traits: ["brave", "curious"],
    });
    expect(char.id).toBeTruthy();
    expect(char.projectId).toBe(projectId);
    expect(char.name).toBe("Alice");
    expect(char.description).toBe("Main protagonist");
    expect(char.traits).toEqual(["brave", "curious"]);
  });

  it("should create a character with default values", async () => {
    const char = await svc.createCharacter(projectId, { name: "Bob" });
    expect(char.description).toBe("");
    expect(char.traits).toEqual([]);
  });

  it("should get characters for a project", async () => {
    await svc.createCharacter(projectId, { name: "Charlie" });
    const chars = await svc.getCharacters(projectId);
    expect(chars.length).toBeGreaterThanOrEqual(1);
    expect(chars.some((c) => c.name === "Charlie")).toBe(true);
  });

  it("should update a character's name and traits", async () => {
    const char = await svc.createCharacter(projectId, {
      name: "Diana",
      traits: ["kind"],
    });
    await svc.updateCharacter(char.id, {
      name: "Diana Updated",
      traits: ["kind", "wise"],
    });
    const chars = await svc.getCharacters(projectId);
    const updated = chars.find((c) => c.id === char.id);
    expect(updated?.name).toBe("Diana Updated");
    expect(updated?.traits).toEqual(["kind", "wise"]);
  });

  it("should delete a character", async () => {
    const char = await svc.createCharacter(projectId, { name: "ToDelete" });
    await svc.deleteCharacter(char.id);
    const chars = await svc.getCharacters(projectId);
    expect(chars.find((c) => c.id === char.id)).toBeUndefined();
  });
});