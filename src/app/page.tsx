import { LandingPage } from "@/components/landing/landing-page";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const { deleted } = await searchParams;

  return (
    <>
      {deleted === "1" ? (
        <p className="dash-flash" style={{ margin: "4.5rem 1rem 0", textAlign: "center" }}>
          Your account and data were deleted.
        </p>
      ) : null}
      <LandingPage />
    </>
  );
}
