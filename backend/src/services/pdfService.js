const PdfPrinter = require('pdfmake');

// ─── Font definitions for pdfmake ───
// Using standard Times-Roman fonts for a professional document look.
const fonts = {
  'Times-Roman': {
    normal: 'Times-Roman',
    bold: 'Times-Bold',
    italics: 'Times-Italic',
    bolditalics: 'Times-BoldItalic'
  }
};

/**
 * Convert a document section into pdfmake content nodes.
 */
function sectionToContent(section) {
  const { heading, level = 2, type, content, headers, rows } = section;
  const nodes = [];

  // Heading styles by level
  const headingStyle = {
    1: { fontSize: 18, bold: true, color: '#000000', margin: [0, 20, 0, 8] },
    2: { fontSize: 16, bold: true, color: '#000000', margin: [0, 16, 0, 6] },
    3: { fontSize: 14, bold: true, color: '#000000', margin: [0, 12, 0, 4] },
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
  if (type === 'paragraph' && typeof content === 'string') {
    nodes.push({
      text: content,
      fontSize: 12,
      lineHeight: 1.5,
      margin: [0, 0, 0, 10],
      color: '#000000',
    });
  }

  // Bullet list
  if (type === 'bullets' && Array.isArray(content)) {
    nodes.push({
      ul: content.map((item) => ({ text: String(item), fontSize: 12, lineHeight: 1.5 })),
      margin: [0, 0, 0, 10],
      color: '#000000',
    });
  }

  // Numbered list
  if (type === 'numbered' && Array.isArray(content)) {
    nodes.push({
      ol: content.map((item) => ({ text: String(item), fontSize: 12, lineHeight: 1.5 })),
      margin: [0, 0, 0, 10],
      color: '#000000',
    });
  }

  // Table
  if (type === 'table' && Array.isArray(headers)) {
    const tableBody = [];

    // Header row
    tableBody.push(
      headers.map((h) => ({
        text: String(h),
        bold: true,
        fontSize: 12,
        color: '#000000',
        alignment: 'center',
        margin: [4, 6, 4, 6],
      }))
    );

    // Data rows
    if (Array.isArray(rows)) {
      rows.forEach((row) => {
        tableBody.push(
          row.map((cell) => ({
            text: String(cell),
            fontSize: 12,
            margin: [4, 4, 4, 4],
            color: '#000000',
          }))
        );
      });
    }

    nodes.push({
      table: {
        headerRows: 1,
        widths: headers.map(() => '*'),
        body: tableBody,
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 1,
        hLineColor: () => '#000000',
        vLineColor: () => '#000000',
      },
      margin: [0, 4, 0, 12],
    });
  }

  return nodes;
}

/**
 * Convert Claude/Ollama's document JSON into a PDF Buffer.
 *
 * @param {object} docJSON - The structured document output
 * @returns {Promise<Buffer>} The generated PDF file as a Buffer
 */
async function generatePdf(docJSON) {
  const { title, sections = [] } = docJSON;

  // Build content array
  const content = [];

  // Title
  content.push({
    text: title,
    fontSize: 20,
    bold: true,
    alignment: 'center',
    color: '#000000',
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
      font: 'Times-Roman',
      fontSize: 12,
      lineHeight: 1.5,
    },
    pageSize: 'A4',
    pageMargins: [72, 72, 72, 72], // 1 inch margins
    footer: (currentPage, pageCount) => ({
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 10,
      color: '#000000',
      margin: [0, 20, 0, 0],
    }),
    info: {
      title: title,
      author: 'Draftly — AI Document Generator',
      creator: 'Draftly',
    },
  };

  return new Promise((resolve, reject) => {
    try {
      const printer = new PdfPrinter(fonts);
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks = [];
      
      pdfDoc.on('data', chunk => chunks.push(chunk));
      pdfDoc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      pdfDoc.on('error', (err) => {
        reject(err);
      });
      
      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = { generatePdf };
