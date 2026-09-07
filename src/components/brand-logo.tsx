import Image from "next/image";
import { BRAND_ICON_PATH } from "@/lib/brand";

type BrandLogoProps = {
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
};

/** Static brand mark — served unoptimized to avoid stale Next.js image cache. */
export function BrandLogo({
  width,
  height,
  className,
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src={BRAND_ICON_PATH}
      alt=""
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized
    />
  );
}
