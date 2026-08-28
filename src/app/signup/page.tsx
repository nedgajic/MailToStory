import { redirect } from "next/navigation";

function buildAuthRedirect(
  auth: "login" | "signup",
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  params.set("auth", auth);
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "auth") continue;
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    }
  }
  return `/?${params.toString()}`;
}

export const metadata = { title: "Sign up — MailToStory" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect(buildAuthRedirect("signup", await searchParams));
}
