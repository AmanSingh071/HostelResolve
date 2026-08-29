import { NextResponse } from "next/server";

type WorkerCredential = {
  id: string;
  pin: string;
  name?: string;
};

function getWorkers(): WorkerCredential[] {
  const raw = process.env.WORKER_CREDENTIALS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((w) => w && typeof w.id === "string" && typeof w.pin === "string")
      .map((w) => ({ id: w.id.trim(), pin: w.pin, name: typeof w.name === "string" ? w.name.trim() : undefined }));
  } catch {
    return [];
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const workerId = typeof body?.workerId === "string" ? body.workerId.trim() : "";
  const workerPin = typeof body?.workerPin === "string" ? body.workerPin : "";

  if (!workerId || !workerPin) {
    return NextResponse.json({ error: "Worker ID and PIN are required." }, { status: 400 });
  }

  const worker = getWorkers().find(
    (entry) => entry.id.toLowerCase() === workerId.toLowerCase() && entry.pin === workerPin
  );

  if (!worker) {
    return NextResponse.json({ error: "Invalid Worker ID or PIN." }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    name: worker.name || worker.id,
  });
}
