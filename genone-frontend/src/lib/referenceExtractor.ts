interface Reference {
  id: string
  title: string
  url?: string
  content?: string
}

export function extractReferences(content: string): { cleanContent: string; references: Reference[] } {
  // console.log('🔍 Extracting references from:', content)

  const references: Reference[] = []
  
  // Pattern to match reference sections (case insensitive)
  const referencePatterns = [
    // References: (with colon, most common)
    /References?:\s*\n([\s\S]*?)(?=\n\n[A-Z]|\n##|\n###|\n---|\n\*\*|$)/gi,
    // **References:** (bold with colon)
    /\*\*References?:\*\*\s*\n([\s\S]*?)(?=\n\n[A-Z]|\n##|\n###|\n---|\n\*\*|$)/gi,
    // ## References (markdown header)
    /## References?\s*\n([\s\S]*?)(?=\n##|\n---|\n\*\*|$)/gi,
    // ### References (markdown subheader)
    /### References?\s*\n([\s\S]*?)(?=\n##|\n###|\n---|\n\*\*|$)/gi,
    // **References** (bold without colon)
    /\*\*References?\*\*\s*\n([\s\S]*?)(?=\n\n[A-Z]|\n##|\n###|\n---|\n\*\*|$)/gi,
  ]
  
  let cleanContent = content
  
  referencePatterns.forEach(pattern => {
    const matches = content.matchAll(pattern)
    
    for (const match of matches) {
      const referenceSection = match[1]
      
      // Extract individual references from the section
      const refLines = referenceSection.split('\n').filter(line => line.trim())
      
      refLines.forEach((line) => {
        const trimmedLine = line.trim()
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          // Parse the specific format: - [[Title]](URL) (Source)
          const specificFormatMatch = trimmedLine.match(/^[-*•]\s*\[\[([^\]]+)\]\]\(([^)]+)\)\s*\(([^)]+)\)/)
          // Parse markdown format: [Title](URL)
          const urlMatch = trimmedLine.match(/\[([^\]]+)\]\(([^)]+)\)/)
          // Simple URL match
          const simpleUrlMatch = trimmedLine.match(/(https?:\/\/[^\s]+)/)
          
          if (specificFormatMatch) {
            references.push({
              id: `ref-${references.length + 1}`,
              title: specificFormatMatch[1],
              url: specificFormatMatch[2],
              content: specificFormatMatch[3] // This is the source (ADO, Confluence, etc.)
            })
          } else if (urlMatch) {
            references.push({
              id: `ref-${references.length + 1}`,
              title: urlMatch[1],
              url: urlMatch[2]
            })
          } else if (simpleUrlMatch) {
            const domain = simpleUrlMatch[1].replace(/^https?:\/\//, '').split('/')[0]
            references.push({
              id: `ref-${references.length + 1}`,
              title: domain,
              url: simpleUrlMatch[1]
            })
          } else if (trimmedLine.length > 5) {
            const cleanTitle = trimmedLine.replace(/^[-*•]\s*/, '')
            references.push({
              id: `ref-${references.length + 1}`,
              title: cleanTitle,
              content: cleanTitle
            })
          }
        }
      })
      
      // Remove the reference section from the content
      cleanContent = cleanContent.replace(match[0], '')
    }
  })
  
  // Clean up extra whitespace
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim()
  
  // console.log('✅ Extracted references:', references)
  
  return { cleanContent, references }
}
