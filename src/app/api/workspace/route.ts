import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { getWorkspaceContext, isWorkspaceAdmin } from "@/lib/session";
import {
  inboundAddress,
  teamWorkspaceErrorMessage,
  updateWorkspaceName,
} from "@/lib/workspace";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ctx = await getWorkspaceContext(session.user.id);
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isWorkspaceAdmin(ctx.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (ctx.workspace.plan !== "team") {
    return NextResponse.json(
      { error: "Team name can be set on the Team plan." },
      { status: 400 },
    );
  }

  let body: { teamName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const teamName = body.teamName?.trim() ?? "";
  if (!teamName) {
    return NextResponse.json({ error: "Enter a team name." }, { status: 400 });
  }

  try {
    const updated = await updateWorkspaceName(ctx.workspace.id, teamName);
    return NextResponse.json({
      ok: true,
      name: updated.name,
      inbound: inboundAddress(updated.inboundLocalPart),
      inboundLocalPart: updated.inboundLocalPart,
    });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: teamWorkspaceErrorMessage(error.message) },
        { status: 400 },
      );
    }
    throw error;
  }
}
