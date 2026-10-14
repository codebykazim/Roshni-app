import type { AnalysedColour } from '@roshni/color-engine';
import { openDatabaseSync } from 'expo-sqlite';

/** What we keep per colour. Names are stored as family + modifier so they can be shown in any language. */
export type StoredColour = Pick<
  AnalysedColour,
  'hex' | 'rgb' | 'share' | 'name' | 'family' | 'modifier'
>;

export type AnalysisSource = 'gallery' | 'camera' | 'live';

export interface Analysis {
  id: string;
  createdAt: number;
  source: AnalysisSource;
  /** Small JPEG as a data URI. Full photos are never stored. */
  thumb: string;
  width: number;
  height: number;
  colours: StoredColour[];
  isFavourite: boolean;
}

interface AnalysisRow {
  id: string;
  created_at: number;
  source: AnalysisSource;
  thumb: string;
  width: number;
  height: number;
  palette: string;
  is_favorite: number;
}

const SCHEMA_VERSION = 1;

const db = openDatabaseSync('roshni.db');

function migrate() {
  const current = db.getFirstSync<{ user_version: number }>('PRAGMA user_version')?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;
  db.withTransactionSync(() => {
    if (current < 1) {
      db.execSync(`
        CREATE TABLE IF NOT EXISTS analyses (
          id TEXT PRIMARY KEY NOT NULL,
          created_at INTEGER NOT NULL,
          source TEXT NOT NULL,
          thumb TEXT NOT NULL,
          width INTEGER NOT NULL,
          height INTEGER NOT NULL,
          palette TEXT NOT NULL,
          is_favorite INTEGER NOT NULL DEFAULT 0
        );
        CREATE INDEX IF NOT EXISTS analyses_created_idx ON analyses (created_at DESC);
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
    }
    db.execSync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  });
}
migrate();

function toAnalysis(row: AnalysisRow): Analysis {
  return {
    id: row.id,
    createdAt: row.created_at,
    source: row.source,
    thumb: row.thumb,
    width: row.width,
    height: row.height,
    colours: JSON.parse(row.palette) as StoredColour[],
    isFavourite: row.is_favorite === 1,
  };
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function insertAnalysis(input: {
  source: AnalysisSource;
  thumb: string;
  width: number;
  height: number;
  colours: AnalysedColour[];
}): Analysis {
  const stored: StoredColour[] = input.colours.map(
    ({ hex, rgb, share, name, family, modifier }) => ({ hex, rgb, share, name, family, modifier }),
  );
  const id = newId();
  const createdAt = Date.now();
  db.runSync(
    'INSERT INTO analyses (id, created_at, source, thumb, width, height, palette, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, 0)',
    id,
    createdAt,
    input.source,
    input.thumb,
    input.width,
    input.height,
    JSON.stringify(stored),
  );
  return {
    id,
    createdAt,
    source: input.source,
    thumb: input.thumb,
    width: input.width,
    height: input.height,
    colours: stored,
    isFavourite: false,
  };
}

export function listAnalyses(options: { favouritesOnly?: boolean } = {}): Analysis[] {
  const where = options.favouritesOnly ? 'WHERE is_favorite = 1' : '';
  return db
    .getAllSync<AnalysisRow>(`SELECT * FROM analyses ${where} ORDER BY created_at DESC`)
    .map(toAnalysis);
}

export function getAnalysis(id: string): Analysis | null {
  const row = db.getFirstSync<AnalysisRow>('SELECT * FROM analyses WHERE id = ?', id);
  return row ? toAnalysis(row) : null;
}

export function setFavourite(id: string, value: boolean): void {
  db.runSync('UPDATE analyses SET is_favorite = ? WHERE id = ?', value ? 1 : 0, id);
}

export function deleteAnalysis(id: string): void {
  db.runSync('DELETE FROM analyses WHERE id = ?', id);
}

/** Remove all history except favourites. */
export function clearHistory(): void {
  db.runSync('DELETE FROM analyses WHERE is_favorite = 0');
}

export function getSetting(key: string): string | null {
  return db.getFirstSync<{ value: string }>('SELECT value FROM settings WHERE key = ?', key)?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    value,
  );
}
