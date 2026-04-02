import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { dirname } from "node:path";

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export class TokenStore {
  constructor(private filePath: string) {}

  async load(): Promise<StoredTokens | null> {
    try {
      const data = await readFile(this.filePath, "utf-8");
      return JSON.parse(data) as StoredTokens;
    } catch {
      return null;
    }
  }

  async save(tokens: StoredTokens): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(tokens, null, 2), { encoding: "utf-8", mode: 0o600 });
  }

  async clear(): Promise<void> {
    try {
      await unlink(this.filePath);
    } catch {
      // file doesn't exist, that's fine
    }
  }

  isAccessTokenExpired(tokens: StoredTokens): boolean {
    return Date.now() >= tokens.expires_at;
  }
}
