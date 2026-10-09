export const DEFAULT_VISIBLE_CATTLE_COUNT = 5;

export function visibleAllocatedCattle(
  cattleEars: string[],
  expanded: boolean,
): string[] {
  return expanded
    ? cattleEars
    : cattleEars.slice(0, DEFAULT_VISIBLE_CATTLE_COUNT);
}

export function hiddenAllocatedCattleCount(cattleEars: string[]): number {
  return Math.max(0, cattleEars.length - DEFAULT_VISIBLE_CATTLE_COUNT);
}