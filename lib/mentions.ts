export const MENTION_PATTERN = /@([a-z0-9_]{3,20})/gi

export function extractMentions(text: string): string[] {
  const handles = new Set<string>()
  const re = new RegExp(MENTION_PATTERN)
  let match: RegExpExecArray | null
  while ((match = re.exec(text))) handles.add(match[1].toLowerCase())
  return [...handles]
}
