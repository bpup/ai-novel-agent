import { getRows, runQuery } from "../db/database";
import type { Character } from "../../types/novel";

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class CharacterService {
  async getCharacters(projectId: string): Promise<Character[]> {
    const rows = await getRows<Character>(
      `SELECT id, project_id as projectId, name, description, traits
       FROM characters WHERE project_id = ? ORDER BY name ASC`,
      [projectId],
    );
    return rows.map((row) => ({
      ...row,
      traits: typeof row.traits === "string" ? JSON.parse(row.traits) : row.traits,
    }));
  }

  async createCharacter(
    projectId: string,
    data: { name: string; description?: string; traits?: string[] },
  ): Promise<Character> {
    const id = generateId();
    const traitsJson = JSON.stringify(data.traits ?? []);
    await runQuery(
      "INSERT INTO characters (id, project_id, name, description, traits) VALUES (?, ?, ?, ?, ?)",
      [id, projectId, data.name, data.description ?? "", traitsJson],
    );
    return { id, projectId, name: data.name, description: data.description ?? "", traits: data.traits ?? [] };
  }

  async updateCharacter(
    characterId: string,
    data: Partial<Pick<Character, "name" | "description" | "traits">>,
  ): Promise<void> {
    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.name !== undefined) {
      fields.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      fields.push("description = ?");
      values.push(data.description);
    }
    if (data.traits !== undefined) {
      fields.push("traits = ?");
      values.push(JSON.stringify(data.traits));
    }

    if (fields.length === 0) return;
    values.push(characterId);
    await runQuery(`UPDATE characters SET ${fields.join(", ")} WHERE id = ?`, values);
  }

  async deleteCharacter(characterId: string): Promise<void> {
    await runQuery("DELETE FROM characters WHERE id = ?", [characterId]);
  }
}

export const characterService = new CharacterService();