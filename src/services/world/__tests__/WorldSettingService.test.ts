import { describe, it, expect, beforeEach, vi } from "vitest";
import { WorldSettingService } from "../service";

vi.mock("../../db/database", () => {
  const store: Record<string, any[]> = {};
  return {
    runQuery: vi.fn(async (_sql: string, params?: unknown[]) => {
      const sqlLc = _sql.toLowerCase();
      const p = (params ?? []) as string[];
      if (sqlLc.startsWith("insert")) {
        const [id, projectId, name, description, category] = p;
        if (!store[projectId]) store[projectId] = [];
        store[projectId].push({ id, projectId, name, description, category });
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
            if (p.length >= 3) store[key][idx].category = p[1];
          }
        }
      }
    }),
    getRows: vi.fn(async (_sql: string, params?: unknown[]) => {
      const projectId = ((params ?? []) as string[])[0] ?? "";
      return store[projectId] ?? [];
    }),
  };
});

describe("WorldSettingService", () => {
  const svc = new WorldSettingService();
  let projectId: string;

  beforeEach(() => {
    projectId = `test-${Date.now()}`;
  });

  it("should create a world setting with all fields", async () => {
    const ws = await svc.createWorldSetting(projectId, {
      name: "Magic System",
      description: "Rules of magic",
      category: "magic",
    });
    expect(ws.id).toBeTruthy();
    expect(ws.projectId).toBe(projectId);
    expect(ws.name).toBe("Magic System");
    expect(ws.description).toBe("Rules of magic");
    expect(ws.category).toBe("magic");
  });

  it("should create a world setting with default values", async () => {
    const ws = await svc.createWorldSetting(projectId, { name: "Geography" });
    expect(ws.description).toBe("");
    expect(ws.category).toBe("");
  });

  it("should get world settings for a project", async () => {
    await svc.createWorldSetting(projectId, { name: "Kingdoms" });
    const list = await svc.getWorldSettings(projectId);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list.some((w) => w.name === "Kingdoms")).toBe(true);
  });

  it("should update a world setting", async () => {
    const ws = await svc.createWorldSetting(projectId, { name: "Old Name" });
    await svc.updateWorldSetting(ws.id, { name: "New Name", category: "updated" });
    const list = await svc.getWorldSettings(projectId);
    const updated = list.find((w) => w.id === ws.id);
    expect(updated?.name).toBe("New Name");
    expect(updated?.category).toBe("updated");
  });

  it("should delete a world setting", async () => {
    const ws = await svc.createWorldSetting(projectId, { name: "ToDelete" });
    await svc.deleteWorldSetting(ws.id);
    const list = await svc.getWorldSettings(projectId);
    expect(list.find((w) => w.id === ws.id)).toBeUndefined();
  });
});