import { describe, it, expect } from "vitest";
import { MIGRATIONS, checkSchemaVersion } from "../database";

describe("Migration definitions", () => {
  it("MIGRATIONS should have versions [1, 2, 3]", () => {
    expect(MIGRATIONS).toHaveLength(3);
    expect(MIGRATIONS[0].version).toBe(1);
    expect(MIGRATIONS[1].version).toBe(2);
    expect(MIGRATIONS[2].version).toBe(3);
  });

  it("MIGRATIONS should be sorted ascending", () => {
    for (let i = 1; i < MIGRATIONS.length; i++) {
      expect(MIGRATIONS[i].version).toBeGreaterThan(MIGRATIONS[i - 1].version);
    }
  });

  it("v1 migration should create characters table", () => {
    const v1 = MIGRATIONS.find((m) => m.version === 1);
    expect(v1).toBeDefined();
    expect(v1!.sql).toHaveLength(1);
    expect(v1!.sql[0]).toContain("CREATE TABLE IF NOT EXISTS characters");
    expect(v1!.sql[0]).toContain("id TEXT PRIMARY KEY");
    expect(v1!.sql[0]).toContain("project_id TEXT NOT NULL");
    expect(v1!.sql[0]).toContain("name TEXT NOT NULL");
    expect(v1!.sql[0]).toContain("traits");
  });

  it("v2 migration should create world_settings table", () => {
    const v2 = MIGRATIONS.find((m) => m.version === 2);
    expect(v2).toBeDefined();
    expect(v2!.sql).toHaveLength(1);
    expect(v2!.sql[0]).toContain("CREATE TABLE IF NOT EXISTS world_settings");
    expect(v2!.sql[0]).toContain("category");
  });

  it("v3 migration should have empty sql array (PRAGMA-based)", () => {
    const v3 = MIGRATIONS.find((m) => m.version === 3);
    expect(v3).toBeDefined();
    expect(v3!.sql).toHaveLength(0);
  });
});

describe("checkSchemaVersion", () => {
  it("should return 0 when _schema_version table is missing (catch error)", async () => {
    const mockDb = {
      select: async () => {
        throw new Error("no such table: _schema_version");
      },
      execute: async () => {},
    };
    const version = await checkSchemaVersion(mockDb as any);
    expect(version).toBe(0);
  });

  it("should return the max version when _schema_version has rows", async () => {
    const mockDb = {
      select: async () => [{ version: 3 }],
      execute: async () => {},
    };
    const version = await checkSchemaVersion(mockDb as any);
    expect(version).toBe(3);
  });

  it("should return 0 when _schema_version is empty", async () => {
    const mockDb = {
      select: async () => [],
      execute: async () => {},
    };
    const version = await checkSchemaVersion(mockDb as any);
    expect(version).toBe(0);
  });
});