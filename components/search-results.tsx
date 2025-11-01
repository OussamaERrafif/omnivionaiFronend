/**
 * Search results component for displaying research findings.
 * 
 * This component renders the complete research results including:
 * - Confidence metrics and trust assessment
 * - Formatted markdown research paper
 * - Grouped citations by trust category
 * - Source metadata (trust scores, relevance)
 * - Interactive citation links
 * 
 * The component uses ReactMarkdown to render the research paper with
 * GFM (GitHub Flavored Markdown) and raw HTML support.
 * 
 * @module components/search-results
 */

"use client"

import React, { useEffect, useState } from "react"
import { TrendingUp, Shield, Sparkles, AlertCircle, Calendar, Target, Database, Globe, CheckCircle, Star, Download, FileText, FileCode, FileType } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"

// Dynamically import DOMPurify only on client side
let DOMPurify: any = null
if (typeof window !== 'undefined') {
  DOMPurify = require('dompurify')
}

/**
 * Represents a single search result/citation.
 */
interface SearchResult {
  /** Unique identifier for the result */
  id: string
  /** Title of the source */
  title: string
  /** Description or excerpt from the source */
  description: string
  /** Source type or category */
  source: string
  /** URL of the source */
  url: string
  /** Additional metadata (trust scores, relevance, etc.) */
  metadata: Record<string, any>
}

/**
 * Props for the SearchResults component.
 */
interface SearchResultsProps {
  /** The original search query */
  query: string
  /** Array of search results/citations */
  results: SearchResult[]
  /** Optional complete search response from backend */
  searchResponse?: {
    /** Synthesized answer */
    answer: string
    /** Array of citations */
    citations: any[]
    /** Confidence score (0.0-1.0) */
    confidence_score: number
    /** Full research paper in markdown */
    markdown_content: string
  }
}

/**
 * SearchResults component - Displays formatted research results.
 * 
 * Renders a comprehensive view of research findings with confidence metrics,
 * formatted markdown content, and categorized citations.
 * 
 * @param props - Component props
 * @returns React component
 */
export function SearchResults({ query, results, searchResponse }: SearchResultsProps) {
  const confidencePercentage = searchResponse ? Math.round(searchResponse.confidence_score * 100) : 0
  const trustedSources = results.filter((r) => r.metadata.is_trusted).length

  // Group citations by trust category
  const groupedCitations = results.reduce((acc, result, index) => {
    const category = result.metadata.author || "Web Resources"
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push({ ...result, citationNumber: index + 1 })
    return acc
  }, {} as Record<string, any[]>)

  // Download functions
  const downloadAsMarkdown = () => {
    const content = searchResponse?.markdown_content || ""
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_research.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAsLatex = () => {
    const markdownContent = searchResponse?.markdown_content || ""
    
    // Convert markdown to LaTeX
    let latexContent = markdownContent
      // Headers
      .replace(/^# (.*?)$/gm, '\\section{$1}')
      .replace(/^## (.*?)$/gm, '\\subsection{$1}')
      .replace(/^### (.*?)$/gm, '\\subsubsection{$1}')
      .replace(/^#### (.*?)$/gm, '\\paragraph{$1}')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '\\textbf{\\textit{$1}}')
      .replace(/\*\*(.*?)\*\*/g, '\\textbf{$1}')
      .replace(/\*(.*?)\*/g, '\\textit{$1}')
      // Code
      .replace(/`(.*?)`/g, '\\texttt{$1}')
      // Lists
      .replace(/^\* (.*?)$/gm, '\\item $1')
      .replace(/^\d+\. (.*?)$/gm, '\\item $1')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/g, '\\href{$2}{$1}')
      // Citations
      .replace(/\[(\d+)\]/g, '\\cite{ref$1}')
    
    // Wrap in LaTeX document
    const fullLatex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{hyperref}
\\usepackage{graphicx}

\\title{${query}}
\\author{OmniAI Research}
\\date{\\today}

\\begin{document}

\\maketitle

${latexContent}

\\end{document}`

    const blob = new Blob([fullLatex], { type: "text/x-latex" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_research.tex`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAsWord = () => {
    const markdownContent = searchResponse?.markdown_content || ""
    
    // Convert markdown to HTML for Word
    let htmlContent = markdownContent
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^\* (.*?)$/gm, '<li>$1</li>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '</p><p>')
    
    // Wrap in proper HTML document for Word
    const wordHtml = `
<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${query}</title>
  <style>
    body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.6; }
    h1 { font-size: 24pt; font-weight: bold; margin-top: 24pt; margin-bottom: 12pt; }
    h2 { font-size: 18pt; font-weight: bold; margin-top: 18pt; margin-bottom: 10pt; }
    h3 { font-size: 14pt; font-weight: bold; margin-top: 14pt; margin-bottom: 8pt; }
    p { margin-bottom: 10pt; }
    code { font-family: 'Courier New', monospace; background-color: #f5f5f5; padding: 2px 4px; }
    a { color: #0563c1; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>${query}</h1>
  <p>${htmlContent}</p>
</body>
</html>`

    const blob = new Blob([wordHtml], { type: "application/msword" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_research.doc`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadAsTxt = () => {
    const markdownContent = searchResponse?.markdown_content || ""
    
    // Strip markdown formatting for plain text
    const txtContent = markdownContent
      .replace(/^#{1,6} (.*?)$/gm, '$1\n' + '='.repeat(50)) // Headers with separator
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1') // Bold italic
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Code
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)') // Links
      .replace(/^\* (.*?)$/gm, '• $1') // Bullet points
    
    const blob = new Blob([txtContent], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${query.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_research.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Function to parse metadata from markdown content using regex
  const parseMetadata = (content: string) => {
    const metadataRegex = /\*\*Research Date\*\*: ([^\n]+)\n\*\*Confidence Level\*\*: ([^\n]+)\n\*\*Sources Analyzed\*\*: ([^\n]+)\n\*\*Domain Diversity\*\*: ([^\n]+)\n\*\*Trust Assessment\*\*: ([^\n]+)\n\*\*Average Trust Score\*\*: ([^\n]+)/
    const match = content.match(metadataRegex)
    
    if (match) {
      return {
        researchDate: match[1],
        confidenceLevel: match[2],
        sourcesAnalyzed: match[3],
        domainDiversity: match[4],
        trustAssessment: match[5],
        averageTrustScore: match[6]
      }
    }
    return null
  }

  // Function to render metadata as badges
  const renderMetadataBadges = (metadata: any) => {
    if (!metadata) return null

    return (
      <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
        <Badge variant="secondary" className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {metadata.researchDate}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Target className="w-3 h-3" />
          {metadata.confidenceLevel}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          {metadata.sourcesAnalyzed}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Globe className="w-3 h-3" />
          {metadata.domainDiversity}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {metadata.trustAssessment}
        </Badge>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {metadata.averageTrustScore}
        </Badge>
      </div>
    )
  }

  // Function to process markdown and add citation links
  const processMarkdownWithCitations = (content: string) => {
    // Extract metadata before processing
    const metadata = parseMetadata(content)
    
    // Remove metadata section from content if found
    let processedContent = content
    if (metadata) {
      processedContent = content.replace(/\*\*Research Date\*\*: [^\n]+\n\*\*Confidence Level\*\*: [^\n]+\n\*\*Sources Analyzed\*\*: [^\n]+\n\*\*Domain Diversity\*\*: [^\n]+\n\*\*Trust Assessment\*\*: [^\n]+\n\*\*Average Trust Score\*\*: [^\n]+\n\n---\n\n/, '')
    }
    
    // Fix duplicate hash symbols in markdown headings - more comprehensive
    // Match patterns like "### ###", "## ##", "# #", etc. and replace with single group
    processedContent = processedContent.replace(/^(#{1,6})\s+(#{1,6})\s+/gm, '$1 ')
    // Also fix cases where there are multiple hash groups: "### ### ###" → "###"
    processedContent = processedContent.replace(/^(#{1,6})(\s+#{1,6})+\s+/gm, '$1 ')
    
    // Clean up list item markers like (i), (ii), (iii), (a), (b), etc. - keep the content but format better
    // This is now handled in the li component above, so we don't need to remove them here
    
    // Remove references section completely - remove heading and all content after it
    let withoutReferences = processedContent
      // Remove everything from "## References" or "# References" to the end of the document
      .replace(/#{1,6}\s*References?\s*[\r\n]+[\s\S]*/gi, '')
    
    // Replace [n] with clickable colored citations
    return { content: withoutReferences, metadata }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Compact disclaimer */}
      <details className="rounded-lg border border-amber-500/20 bg-amber-500/5 group">
        <summary className="cursor-pointer p-3 flex items-center gap-2 text-xs sm:text-sm text-amber-200/90 hover:text-amber-200 transition-colors list-none">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span className="font-medium">AI-Generated Content Notice</span>
          <span className="ml-auto text-amber-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="px-3 pb-3 text-xs text-amber-200/80 leading-relaxed">
          This research article was synthesized by AI from multiple sources. While we strive for accuracy, please verify critical information independently.
        </div>
      </details>

      <div className="space-y-4 sm:space-y-6 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground text-balance leading-tight tracking-tight">{query}</h1>
          
          {searchResponse?.markdown_content && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadAsMarkdown} className="cursor-pointer">
                  <FileCode className="w-4 h-4 mr-2" />
                  Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsLatex} className="cursor-pointer">
                  <FileType className="w-4 h-4 mr-2" />
                  LaTeX (.tex)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsWord} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Word (.doc)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsTxt} className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Plain Text (.txt)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Card
        className="p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-card via-card to-card/50 border-border/50 shadow-2xl shadow-black/10 relative overflow-hidden animate-fade-in-up transition-all duration-500 hover:shadow-primary/5"
        style={{ animationDelay: "200ms" }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.7_0.19_240/0.05),transparent_50%)]" />
        <style jsx>{`
          .citation-link {
            color: hsl(var(--primary));
            font-weight: bold;
            text-decoration: none;
            padding: 0 2px;
            border-radius: 2px;
            transition: all 0.2s;
            display: inline-block;
          }
          .citation-link:hover {
            background: hsl(var(--primary) / 0.1);
            transform: translateY(-1px);
          }
        `}</style>
        <article className="prose prose-invert max-w-none relative z-10 prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-code:text-primary prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/50 prose-blockquote:border-primary/30 prose-blockquote:text-foreground/80 prose-ul:text-foreground/90 prose-ol:text-foreground/90 prose-li:text-foreground/90 prose-sm sm:prose-base">
          {searchResponse?.markdown_content ? (() => {
            const { content, metadata } = processMarkdownWithCitations(searchResponse.markdown_content)
            return (
              <>
                {renderMetadataBadges(metadata)}
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({ node, ...props }) => {
                      const titleText = typeof props.children === 'string' ? props.children.replace(/^Title:\s*/i, '') : props.children;
                      return <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 mt-6 sm:mt-8 text-foreground text-center" {...props}>{titleText}</h1>;
                    },
                    h2: ({ node, ...props }) => {
                      // Main sections (Abstract, Introduction, Conclusion, Discussion, Chapter headings) - make them prominent
                      return <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 mt-8 sm:mt-12 text-foreground border-b-2 border-primary/30 pb-3" {...props} />;
                    },
                    h3: ({ node, ...props }) => {
                      // Subsections within chapters - medium size
                      return <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 mt-6 sm:mt-8 text-foreground/95" {...props} />;
                    },
                    h4: ({ node, ...props }) => {
                      // Sub-subsections - smaller
                      return <h4 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 mt-4 sm:mt-6 text-foreground/90" {...props} />;
                    },
                    h5: ({ node, ...props }) => {
                      return <h5 className="text-base sm:text-lg font-semibold mb-2 mt-3 text-foreground/85" {...props} />;
                    },
                    h6: ({ node, ...props }) => {
                      return <h6 className="text-sm sm:text-base font-semibold mb-2 mt-3 text-foreground/80" {...props} />;
                    },
                    p: ({ node, ...props }) => {
                      // Check if paragraph contains block-level elements (img/figure) that should not be wrapped in <p>
                      const hasBlockElement = React.Children.toArray(props.children).some((child: any) => {
                        return child?.type === 'figure' || child?.type === 'img' || 
                               (child?.props?.node?.tagName === 'img');
                      });
                      
                      // If contains block elements, render as div instead of p to avoid hydration errors
                      if (hasBlockElement) {
                        return <div className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 text-foreground/90" {...props} />
                      }
                      
                      // Process paragraph content to add citation links
                      const content = props.children
                      if (typeof content === 'string') {
                        const processedContent = content.replace(/\[(\d+)\]/g, (match, num) => {
                          const citationNum = parseInt(num)
                          const citation = results[citationNum - 1]
                          if (citation) {
                            return `<a id="citation-${citationNum}" href="${citation.url}" target="_blank" rel="noopener noreferrer" class="citation-link" data-citation="${citationNum}">[${num}]</a>`
                          }
                          return match
                        })
                        
                        // ✅ SECURITY FIX: Sanitize HTML to prevent XSS attacks (client-side only)
                        const sanitizedContent = DOMPurify 
                          ? DOMPurify.sanitize(processedContent, {
                              ALLOWED_TAGS: ['a'],
                              ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id', 'data-citation'],
                              ALLOWED_URI_REGEXP: /^(?:https?|mailto):/i
                            })
                          : processedContent // Fallback if DOMPurify not loaded yet
                        
                        return <p className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 text-foreground/90" dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
                      }
                      return <p className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 text-foreground/90" {...props} />
                    },
                    a: ({ node, ...props }) => <a className="text-primary hover:text-primary/80 transition-colors underline-offset-4" target="_blank" rel="noopener noreferrer" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-foreground/90" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-foreground/90" {...props} />,
                    li: ({ node, ...props }) => {
                      // Handle nested lists and different list styles (i), (ii), (a), (b), etc.
                      const content = props.children;
                      if (typeof content === 'string') {
                        // Remove leading markers like (i), (ii), (a), (b), 1., 2., etc.
                        const cleanedContent = content.replace(/^\s*[\(（]?([ivxIVX]+|[a-z]|[A-Z]|\d+)[\)）]?\.?\s*/, '');
                        return <li className="text-sm sm:text-base leading-relaxed ml-2" {...props}>{cleanedContent}</li>;
                      }
                      return <li className="text-sm sm:text-base leading-relaxed ml-2" {...props} />
                    },
                    img: ({ node, ...props }) => {
                      // Render images with proper styling
                      return (
                        <figure className="my-6">
                          <img 
                            className="w-full max-w-2xl mx-auto rounded-lg border border-border/50 shadow-lg" 
                            loading="lazy"
                            {...props} 
                          />
                          {props.alt && (
                            <figcaption className="text-center text-sm text-muted-foreground mt-2 italic">
                              {props.alt}
                            </figcaption>
                          )}
                        </figure>
                      );
                    },
                    code: ({ node, className, children, ...props }) => {
                      const isInline = !className
                      return isInline ? (
                        <code className="bg-muted/50 text-primary px-1 sm:px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono" {...props}>
                          {children}
                        </code>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                    pre: ({ node, ...props }) => <pre className="bg-muted/50 border border-border/50 rounded-lg p-3 sm:p-4 overflow-x-auto mb-3 sm:mb-4 text-xs sm:text-sm" {...props} />,
                    blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/30 pl-3 sm:pl-4 italic text-foreground/80 my-3 sm:my-4" {...props} />,
                    hr: ({ node, ...props }) => <hr className="border-border/50 my-6 sm:my-8" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </>
            )
          })() : searchResponse?.answer ? (
            <div className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {searchResponse.answer}
            </div>
          ) : (
            <p className="text-muted-foreground italic">Processing research data...</p>
          )}
        </article>
      </Card>
    </div>
  )
}
