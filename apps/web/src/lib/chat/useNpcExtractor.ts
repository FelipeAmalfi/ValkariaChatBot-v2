export function useNpcExtractor() {
  const extractNpcName = (text: string): string | null => {
    const boldMatch = text.match(/\*\*([^*]+)\*\*/)
    if (boldMatch) return boldMatch[1]
    return null
  }
  return { extractNpcName }
}
