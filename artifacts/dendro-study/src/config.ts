export const R2_BASE_URL =
  "https://pub-831dd9822f5d43089f4c201560600dbf.r2.dev";

export function imgUrl(path: string | null | undefined): string | null {
  return path ? `${R2_BASE_URL}/${path}` : null;
}
