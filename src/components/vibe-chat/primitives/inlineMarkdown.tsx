export function renderInlineMarkdown(text: string) {
  const parts: (string | JSX.Element)[] = []
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const token = match[0]
    if (token.startsWith('**')) {
      parts.push(
        <strong key={key++} className="font-bold text-fg">
          {token.slice(2, -2)}
        </strong>,
      )
    } else {
      parts.push(
        <code
          key={key++}
          className="font-mono text-[11.5px] px-[5px] py-[1px] bg-line-soft text-fg rounded border border-line"
        >
          {token.slice(1, -1)}
        </code>,
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
