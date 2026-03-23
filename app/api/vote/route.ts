import { NextRequest, NextResponse } from "next/server";
import { getRoom, setRoom } from "@/lib/store";
import { Participant } from "@/lib/types";

// POST /api/vote  { roomId, participantId, participantName, vote? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { roomId, participantId, participantName, vote } = body as {
    roomId: string;
    participantId: string;
    participantName: string;
    vote?: string | null;
  };

  const room = getRoom(roomId);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const existing = room.participants.find((p) => p.id === participantId);
  if (existing) {
    if (vote !== undefined) existing.vote = vote ?? null;
  } else {
    const newParticipant: Participant = {
      id: participantId,
      name: participantName || "Anônimo",
      vote: vote ?? null,
      joinedAt: Date.now(),
    };
    room.participants.push(newParticipant);
  }

  setRoom(room);
  return NextResponse.json(room);
}

// DELETE /api/vote  { roomId, participantId }
export async function DELETE(req: NextRequest) {
  let body: { roomId: string; participantId: string };
  try {
    body = await req.json();
  } catch {
    const text = await req.text();
    body = JSON.parse(text);
  }

  const { roomId, participantId } = body;
  const room = getRoom(roomId);
  if (!room) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  room.participants = room.participants.filter((p) => p.id !== participantId);
  setRoom(room);
  return NextResponse.json(room);
}
