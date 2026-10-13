/**
 * Document Normalizer Service
 * 
 * Ensures robust schema compliance and resilient formatting.
 * Handles LLM quirks such as:
 * - Table rows as objects instead of arrays
 * - Mismatched column counts between headers and rows
 * - Paragraph content as string arrays instead of single strings
 * - List content as newline-separated strings instead of arrays
 * - Type aliases (e.g. 'bullet' -> 'bullets', 'text' -> 'paragraph')
 * - Nested root wrappers (e.g. { document: { ... } } or { data: { ... } })
 */

function normalizeDocumentJSON(rawDoc) {
  if (!rawDoc || typeof rawDoc !== 'object') {
    throw new Error('Invalid document: must be an object');
  }

  // Unwrap potential wrapper keys from various LLMs
  let doc = rawDoc;
  if (doc.document && typeof doc.document === 'object') {
    doc = doc.document;
  } else if (doc.data && typeof doc.data === 'object') {
    doc = doc.data;
  } else if (doc.result && typeof doc.result === 'object') {
    doc = doc.result;
  }

  // 1. Title
  const title = typeof doc.title === 'string' && doc.title.trim()
    ? doc.title.trim()
    : 'Draftly Document';

  // 2. Metadata
  const rawMeta = (doc.metadata && typeof doc.metadata === 'object') ? doc.metadata : {};
  const metadata = {
    font: typeof rawMeta.font === 'string' && rawMeta.font.trim() ? rawMeta.font.trim() : 'Times New Roman',
    fontSize: Number(rawMeta.fontSize) > 0 ? Number(rawMeta.fontSize) : 12,
    lineSpacing: Number(rawMeta.lineSpacing) > 0 ? Number(rawMeta.lineSpacing) : 1.5,
  };

  // 3. Sections
  const rawSections = Array.isArray(doc.sections)
    ? doc.sections
    : typeof doc.sections === 'object' && doc.sections !== null
    ? Object.values(doc.sections)
    : [];

  const sections = rawSections
    .filter((s) => s && typeof s === 'object')
    .map((s) => normalizeSection(s));

  if (sections.length === 0) {
    sections.push({
      heading: 'Overview',
      level: 1,
      type: 'paragraph',
      content: 'Document content could not be structured.',
    });
  }

  // Calculate stats
  let totalWords = 0;
  for (const s of sections) {
    if (typeof s.content === 'string') {
      totalWords += s.content.trim().split(/\s+/).filter(Boolean).length;
    } else if (Array.isArray(s.content)) {
      for (const item of s.content) {
        totalWords += String(item).trim().split(/\s+/).filter(Boolean).length;
      }
    }
  }

  return {
    title,
    metadata,
    sections,
    stats: {
      sectionsCount: sections.length,
      wordCount: totalWords,
    },
  };
}

function normalizeSection(s) {
  const heading = typeof s.heading === 'string' ? s.heading.trim() : '';
  const level = [1, 2, 3].includes(Number(s.level)) ? Number(s.level) : 2;

  // Normalize type
  let type = typeof s.type === 'string' ? s.type.toLowerCase().trim() : 'paragraph';
  if (['para', 'text', 'body', 'description'].includes(type)) type = 'paragraph';
  if (['bullet', 'bullets_list', 'list', 'items'].includes(type)) type = 'bullets';
  if (['number', 'numbered_list', 'ordered', 'steps'].includes(type)) type = 'numbered';
  if (['table', 'grid', 'data_table'].includes(type)) type = 'table';
  if (['heading', 'header', 'title_only'].includes(type)) type = 'heading_only';

  const section = { heading, level, type };

  if (type === 'heading_only') {
    return section;
  }

  if (type === 'paragraph') {
    if (Array.isArray(s.content)) {
      section.content = s.content.map(String).join('\n\n');
    } else if (typeof s.content === 'object' && s.content !== null) {
      section.content = Object.entries(s.content)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    } else {
      section.content = String(s.content || '');
    }
    return section;
  }

  if (type === 'bullets' || type === 'numbered') {
    if (Array.isArray(s.content)) {
      section.content = s.content
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            return Object.values(item).join(' - ');
          }
          return String(item).trim();
        })
        .filter(Boolean);
    } else if (typeof s.content === 'string') {
      section.content = s.content
        .split(/\r?\n/)
        .map((line) => line.replace(/^[-*•\d.]+\s*/, '').trim())
        .filter(Boolean);
    } else {
      section.content = [String(s.content || '')];
    }
    return section;
  }

  if (type === 'table') {
    let headers = Array.isArray(s.headers) ? s.headers.map(String) : [];
    let rawRows = Array.isArray(s.rows) ? s.rows : [];

    // If headers missing but rows has objects, infer headers from keys
    if (headers.length === 0 && rawRows.length > 0 && typeof rawRows[0] === 'object' && !Array.isArray(rawRows[0])) {
      headers = Object.keys(rawRows[0]);
    }

    if (headers.length === 0) {
      headers = ['Item', 'Details'];
    }

    const colCount = headers.length;

    // Normalize rows into 2D array of strings matching colCount
    const rows = rawRows.map((row) => {
      if (Array.isArray(row)) {
        const cells = row.map((c) => String(c ?? ''));
        while (cells.length < colCount) cells.push('');
        return cells.slice(0, colCount);
      }

      if (typeof row === 'object' && row !== null) {
        return headers.map((h, i) => {
          if (row[h] !== undefined) return String(row[h] ?? '');
          const vals = Object.values(row);
          return vals[i] !== undefined ? String(vals[i] ?? '') : '';
        });
      }

      const single = [String(row ?? '')];
      while (single.length < colCount) single.push('');
      return single;
    });

    section.headers = headers;
    section.rows = rows;
    return section;
  }

  // Fallback to paragraph
  section.type = 'paragraph';
  section.content = String(s.content || '');
  return section;
}

module.exports = { normalizeDocumentJSON };
