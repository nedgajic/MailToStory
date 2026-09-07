import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { APP_VERSION } from "@/lib/app-version";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      version: APP_VERSION,
      db: "ok",
    });
  } catch (error) {
    console.error("[health] database check failed", error);
    return NextResponse.json(
      {
        ok: false,
        version: APP_VERSION,
        db: "error",
      },
      { status: 503 },
    );
  }
}
