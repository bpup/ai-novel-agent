import { getRows, runQuery } from "../db/database";
import type { WorldSetting } from "../../types/novel";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class WorldSettingService {
  async getWorldSettings(projectId: string): Promise<WorldSetting[]> {
    return getRows<WorldSetting>(
      `SELECT id, project_id as projectId, name, description, category
       FROM world_settings WHERE project_id = ? ORDER BY name ASC`,
      [projectId],
    );
  }

  async createWorldSetting(
    projectId: string,
    data: { name: string; description?: string; category?: string },
  ): Promise<WorldSetting> {
    const id = generateId();
    await runQuery(
      "INSERT INTO world_settings (id, project_id, name, description, category) VALUES (?, ?, ?, ?, ?)",
      [id, projectId, data.name, data.description ?? "", data.category ?? ""],
    );
    return {
      id,
      projectId,
      name: data.name,
      description: data.description ?? "",
      category: data.category ?? "",
    };
  }

  async updateWorldSetting(
    worldSettingId: string,
    data: Partial<Pick<WorldSetting, "name" | "description" | "category">>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: string[] = [];

    if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
    if (data.description !== undefined) { fields.push("description = ?"); values.push(data.description); }
    if (data.category !== undefined) { fields.push("category = ?"); values.push(data.category); }

    if (fields.length === 0) return;
    values.push(worldSettingId);
    await runQuery(`UPDATE world_settings SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  async deleteWorldSetting(worldSettingId: string): Promise<void> {
    await runQuery("DELETE FROM world_settings WHERE id = ?", [worldSettingId]);
  }
}

export const worldSettingService = new WorldSettingService();