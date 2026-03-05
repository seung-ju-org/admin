import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

const MARK_CANDIDATES = [
  "logo-mark.png",
  "logo-mark.svg",
  "logo-mark.webp",
  "logo-mark.jpg",
  "logo-mark.jpeg",
] as const;

const WORDMARK_CANDIDATES = [
  "logo-wordmark.png",
  "logo-wordmark.svg",
  "logo-wordmark.webp",
  "logo-wordmark.jpg",
  "logo-wordmark.jpeg",
] as const;

function findAsset(candidates: readonly string[]) {
  for (const name of candidates) {
    const filePath = path.join(process.cwd(), "public", name);
    if (fs.existsSync(filePath)) {
      return `/${name}`;
    }
  }

  return null;
}

const markSrc = findAsset(MARK_CANDIDATES);
const wordmarkSrc = findAsset(WORDMARK_CANDIDATES);

export function BrandLogo({
  iconSize = 32,
  wordmarkWidth = 136,
  onDark = false,
}: {
  iconSize?: number;
  wordmarkWidth?: number;
  onDark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      {markSrc ? (
        <div className={onDark ? "rounded-md bg-white p-1" : ""}>
          <Image
            alt="Seung Ju mark"
            className="h-auto w-auto"
            height={iconSize}
            priority
            src={markSrc}
            width={iconSize}
          />
        </div>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
          SJ
        </div>
      )}

      {wordmarkSrc ? (
        <div className={onDark ? "rounded-md bg-white px-2 py-1" : ""}>
          <Image
            alt="Seung Ju"
            className="h-auto w-auto"
            height={Math.round(wordmarkWidth / 5.6)}
            priority
            src={wordmarkSrc}
            width={wordmarkWidth}
          />
        </div>
      ) : (
        <span className="text-sm font-semibold tracking-tight">Seung Ju</span>
      )}
    </div>
  );
}
