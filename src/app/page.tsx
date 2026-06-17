import { getServerSession } from "next-auth/next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/threads");
  }

  return (
    <main className="landing-root">
      <p className="landing-kicker">Gmail Digest</p>
      <h1 className="landing-title">
        Turn noisy threads into a calm reading experience
      </h1>
      <p className="landing-lead">
        Sign in with Google. Pick a thread. Get a structured digest: story,
        timeline, and open actions—with prose that reads more like an article
        than an inbox.
      </p>
      <Link href="/api/auth/signin" className="landing-cta">
        Continue with Google
      </Link>
      <p className="landing-foot">
        Uses read-only Gmail access plus an LLM to format what you already have.
        Configure <code>GEMINI_API_KEY</code> in <code>.env</code>.
      </p>
    </main>
  );
}
