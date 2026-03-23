import { getRoom, getStore, setRoom } from "@/lib/store";
import { DEFAULT_CARD_VALUES, Room } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

// GET /api/room?id=xxx
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const room = getRoom(id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  return NextResponse.json(room);
}

// POST /api/room  { name, cardValues? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, cardValues } = body as { name: string; cardValues?: string[] };

  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  // Garante ID único — evita sobrescrever sala ativa em caso de colisão
  let id: string;
  do {
    id = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (getStore().has(id));
  const room: Room = {
    id,
    name: name.trim(),
    cardValues: cardValues ?? DEFAULT_CARD_VALUES,
    participants: [],
    revealed: false,
    currentStory: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  setRoom(room);
  return NextResponse.json(room, { status: 201 });
}

// PATCH /api/room  { id, cardValues?, currentStory?, revealed?, reset? }
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, cardValues, currentStory, revealed, reset } = body;

  const room = getRoom(id);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  if (cardValues !== undefined) room.cardValues = cardValues;
  if (currentStory !== undefined) room.currentStory = currentStory;
  if (revealed !== undefined) room.revealed = revealed;
  if (reset) {
    room.revealed = false;
    room.participants = room.participants.map((p) => ({ ...p, vote: null }));
  }

  setRoom(room);
  return NextResponse.json(room);
}
