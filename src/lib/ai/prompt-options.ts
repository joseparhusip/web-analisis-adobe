export const PROMPT_COUNTS = [1, 3, 5, 7, 10] as const;
export const MAX_PROMPT_COUNT = 10;
export const DEFAULT_PROMPT_COUNT = 3;

export function isPromptCount(value: number): boolean {
  return (PROMPT_COUNTS as readonly number[]).includes(value);
}
