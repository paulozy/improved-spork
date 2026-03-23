import fs from "fs";
import path from "path";
import { Room } from "./types";

const DATA_FILE = path.join(process.cwd(), ".data", "rooms.json");
const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

declare global {
  // eslint-disable-next-line no-var
  var __roomStore: Map<string, Room> | undefined;
}

function loadFromDisk(): Map<string, Room> {
  try {
    if (!fs.existsSync(DATA_FILE)) return new Map();
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const entries: [string, Room][] = JSON.parse(raw);
    const now = Date.now();
    // Descarta salas expiradas ao carregar
    return new Map(entries.filter(([, r]) => now - r.updatedAt < ROOM_TTL_MS));
  } catch {
    return new Map();
  }
}

function saveToDisk(store: Map<string, Room>): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(Array.from(store.entries())), "utf-8");
  } catch {
    // Ambiente sem filesystem gravável (ex: Vercel serverless) — ignora silenciosamente
  }
}

export function getStore(): Map<string, Room> {
  if (!global.__roomStore) {
    global.__roomStore = loadFromDisk();
  }
  return global.__roomStore;
}

export function getRoom(id: string): Room | undefined {
  return getStore().get(id);
}

export function setRoom(room: Room): void {
  room.updatedAt = Date.now();
  const store = getStore();
  store.set(room.id, room);

  // Cleanup de salas expiradas a cada escrita para evitar crescimento ilimitado
  const now = Date.now();
  store.forEach((r, id) => {
    if (now - r.updatedAt > ROOM_TTL_MS) store.delete(id);
  });

  saveToDisk(store);
}
