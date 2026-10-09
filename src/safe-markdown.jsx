function pushText(nodes, text, keyPrefix, startIndex) {
  if (!text) return startIndex
  let index = startIndex
  const parts = text.split('\n')
  parts.forEach((part, partIndex) => {
    if (part) {
      nodes.push(part)
      index += 1
    }
    if (partIndex < parts.length - 1) {
      nodes.push(<br key={`${keyPrefix}-br-${index}`} />)
      index += 1
    }
  })
  return index
}

function renderEmphasis(text, keyPrefix) {
  const nodes = []
  let last = 0
  let index = 0
  const re = /(\*\*|__)(.+?)\1|(\*|_)([^*_\n]+?)\3/g
  let match
  while ((match = re.exec(text))) {
    index = pushText(nodes, text.slice(last, match.index), keyPrefix, index)
    if (match[1]) {
      nodes.push(<strong key={`${keyPrefix}-s-${index}`}>{match[2]}</strong>)
    } else {
      nodes.push(<em key={`${keyPrefix}-e-${index}`}>{match[4]}</em>)
    }
    index += 1
    last = match.index + match[0].length
  }
  pushText(nodes, text.slice(last), keyPrefix, index)
  return nodes
}

function renderInline(text, keyPrefix) {
  const source = String(text)
  const nodes = []
  let last = 0
  let index = 0
  const linkRe = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  let match
  while ((match = linkRe.exec(source))) {
    if (match.index > last) {
      nodes.push(...renderEmphasis(source.slice(last, match.index), `${keyPrefix}-${index}`))
      index += 1
    }
    nodes.push(
      <a key={`${keyPrefix}-a-${index}`} href={match[2]} target="_blank" rel="noreferrer">
        {match[1]}
      </a>,
    )
    index += 1
    last = match.index + match[0].length
  }
  if (last < source.length) {
    nodes.push(...renderEmphasis(source.slice(last), `${keyPrefix}-${index}`))
  }
  return nodes.length ? nodes : source
}

function parseBlocks(markdown) {
  const lines = String(markdown || '').split(/\r?\n/)
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      i += 1
      continue
    }
    if (line.startsWith('```')) {
      const fence = []
      i += 1
      while (i < lines.length && !lines[i].startsWith('```')) {
        fence.push(lines[i])
        i += 1
      }
      if (i < lines.length) i += 1
      blocks.push({ type: 'code', text: fence.join('\n') })
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      i += 1
      continue
    }
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const items = []
      const ordered = /^\d+\.\s+/.test(line)
      while (i < lines.length && (ordered ? /^\d+\.\s+/ : /^[-*]\s+/).test(lines[i])) {
        items.push(lines[i].replace(ordered ? /^\d+\.\s+/ : /^[-*]\s+/, ''))
        i += 1
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', items })
      continue
    }
    const paragraph = [line]
    i += 1
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith('```') &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paragraph.push(lines[i])
      i += 1
    }
    blocks.push({ type: 'p', text: paragraph.join('\n') })
  }
  return blocks
}

export function SafeMarkdown({ text }) {
  const blocks = parseBlocks(text)
  if (!blocks.length) return null
  return (
    <div className="ask-markdown">
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          const Tag = `h${Math.min(block.level + 2, 6)}`
          return <Tag key={index}>{renderInline(block.text, `h-${index}`)}</Tag>
        }
        if (block.type === 'code') {
          return (
            <pre key={index} className="ask-markdown-code">
              {block.text}
            </pre>
          )
        }
        if (block.type === 'ul' || block.type === 'ol') {
          const Tag = block.type
          return (
            <Tag key={index}>
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{renderInline(item, `li-${index}-${itemIndex}`)}</li>
              ))}
            </Tag>
          )
        }
        return <p key={index}>{renderInline(block.text, `p-${index}`)}</p>
      })}
    </div>
  )
}
