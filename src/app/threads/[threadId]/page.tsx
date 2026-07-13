import { redirect } from "next/navigation";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  redirect(`/threads?thread=${encodeURIComponent(threadId)}`);
}
