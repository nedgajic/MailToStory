import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { LandingPage } from "@/components/landing/landing-page";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/threads");
  }

  return <LandingPage />;
}
