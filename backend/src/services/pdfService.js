const PdfPrinter = require('pdfmake');
const { normalizeDocumentJSON } = require('./documentNormalizer');

// ─── Font definitions for pdfmake ───
const fonts = {
  'Times-Roman': {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic',
  },
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
};

/**
 * Convert a document section into pdfmake content nodes.
 */
function sectionToContent(section) {
  const { heading, level = 2, type, content, headers, rows } = section;
  const nodes = [];

  // Heading styles by level
  const headingStyle = {
    1: { fontSize: 17, bold: true, color: '#0f172a', margin: [0, 18, 0, 8] },
    2: { fontSize: 14, bold: true, color: '#1e293b', margin: [0, 14, 0, 6] },
    3: { fontSize: 12, bold: true, color: '#334155', margin: [0, 10, 0, 4] },
  };

  // Section heading
  if (heading) {
    nodes.push({
      text: heading,
      ...(headingStyle[level] || headingStyle[2]),
    });
  }

  if (type === 'heading_only') return nodes;

  // Paragraph
  if (type === 'paragraph' && content) {
    const paragraphs = String(content).split(/\n\n+/);
    for (const p of paragraphs) {
      nodes.push({
        text: p.trim(),
        fontSize: 11,
        lineHeight: 1.45,
        margin: [0, 0, 0, 8],
        color: '#1e293b',
      });
    }
  }

  // Bullet list
  if (type === 'bullets' && Array.isArray(content)) {
    nodes.push({
      ul: content.map((item) => ({ text: String(item), fontSize: 11, lineHeight: 1.45 })),
      margin: [0, 0, 0, 8],
      color: '#1e293b',
    });
  }

  // Numbered list
  if (type === 'numbered' && Array.isArray(content)) {
    nodes.push({
      ol: content.map((item) => ({ text: String(item), fontSize: 11, lineHeight: 1.45 })),
      margin: [0, 0, 0, 8],
      color: '#1e293b',
    });
  }

  // Table
  if (type === 'table') {
    const safeHeaders = Array.isArray(headers) && headers.length > 0 ? headers : ['Item', 'Details'];
    const colCount = safeHeaders.length;
    const tableBody = [];

    // Header row
    tableBody.push(
      safeHeaders.map((h) => ({
        text: String(h),
        bold: true,
        fontSize: 10.5,
        color: '#0f172a',
        fillColor: '#f1f5f9',
        alignment: 'center',
        margin: [4, 6, 4, 6],
      }))
    );

    // Data rows — guarantee exact column count per row for pdfmake stability
    const safeRows = Array.isArray(rows) ? rows : [];
    safeRows.forEach((row) => {
      const cells = Array.isArray(row) ? row : [row];
      const rowNodes = safeHeaders.map((_, idx) => ({
        text: cells[idx] !== undefined ? String(cells[idx]) : '',
        fontSize: 10,
        margin: [4, 4, 4, 4],
        color: '#1e293b',
      }));
      tableBody.push(rowNodes);
    });

    nodes.push({
      table: {
        headerRows: 1,
        widths: safeHeaders.map(() => '*'),
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 0.6,
        vLineWidth: () => 0.6,
        hLineColor: () => '#cbd5e1',
        vLineColor: () => '#cbd5e1',
      },
      margin: [0, 4, 0, 12],
    });
  }

  return nodes;
}

/**
 * Convert structured document JSON into a PDF Buffer.
 *
 * @param {object} docJSON - The structured document output
 * @returns {Promise<Buffer>} The generated PDF file as a Buffer
 */
async function generatePdf(docJSON) {
  const normalized = normalizeDocumentJSON(docJSON);
  const { title, sections = [], metadata = {} } = normalized;

  const fontName = metadata.font?.toLowerCase().includes('sans') || metadata.font?.toLowerCase().includes('arial')
    ? 'Helvetica'
    : 'Times-Roman';

  const content = [];

  // Title
  content.push({
    text: title,
    fontSize: 20,
    bold: true,
    alignment: 'center',
    color: '#0f172a',
    margin: [0, 0, 0, 20],
  });

  // Sections
  for (const section of sections) {
    const nodes = sectionToContent(section);
    content.push(...nodes);
  }

  const docDefinition = {
    content,
    defaultStyle: {
      font: fontName,
      fontSize: 11,
      lineHeight: 1.45,
    },
    pageSize: 'A4',
    pageMargins: [54, 54, 54, 54], // ~0.75 inch margins for clean layout
    footer: (currentPage, pageCount) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 9,
      color: '#64748b',
      margin: [0, 16, 0, 0],
    }),
    info: {
      title: title,
      author: 'Draftly — AI Document Generator',
      creator: 'Draftly Studio',
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];

      pdfDoc.on('data', (chunk) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err) => reject(err));

      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePdf };
