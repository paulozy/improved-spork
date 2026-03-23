import { Room } from "./types";

// In production Vercel, each serverless invocation is stateless.
// We use a module-level cache that works well for short-lived sessions.
// For persistent rooms, swap this with a Redis/Upstash/KV store.

declare global {
  // eslint-disable-next-line no-var
  var __roomStore: Map<string, Room> | undefined;
}

export function getStore(): Map<string, Room> {
  if (!global.__roomStore) {
    global.__roomStore = new Map<string, Room>();
  }
  return global.__roomStore;
}

export function getRoom(id: string): Room | undefined {
  return getStore().get(id);
}

export function setRoom(room: Room): void {
  room.updatedAt = Date.now();
  getStore().set(room.id, room);
}
