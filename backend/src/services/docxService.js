const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  convertInchesToTwip,
} = require('docx');
const { normalizeDocumentJSON } = require('./documentNormalizer');

// ─── Heading level mapping ───
const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
};

/**
 * Build a styled table from headers and rows.
 */
function buildTable(headers = [], rows = [], fontFamily = 'Times New Roman') {
  const safeHeaders = Array.isArray(headers) && headers.length > 0 ? headers : ['Item', 'Details'];
  const colCount = safeHeaders.length;
  const colWidthPct = Math.max(5, Math.floor(100 / colCount));

  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: safeHeaders.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: String(h), bold: true, color: '000000', font: fontFamily, size: 22 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: colWidthPct, type: WidthType.PERCENTAGE },
        })
    ),
  });

  // Data rows
  const dataRows = (rows || []).map((row) => {
    const cells = Array.isArray(row) ? row : [row];
    return new TableRow({
      children: safeHeaders.map((_, idx) => {
        const cellValue = cells[idx] !== undefined ? String(cells[idx]) : '';
        return new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: cellValue, font: fontFamily, size: 22, color: '000000' })],
            }),
          ],
          width: { size: colWidthPct, type: WidthType.PERCENTAGE },
        });
      }),
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
    },
  });
}

/**
 * Convert structured document JSON into a .docx Buffer.
 *
 * @param {object} docJSON - Structured document output
 * @returns {Promise<Buffer>} The generated .docx file as a Buffer
 */
async function generateDocx(docJSON) {
  const normalized = normalizeDocumentJSON(docJSON);
  const { title, metadata = {}, sections = [] } = normalized;

  const fontFamily = metadata.font || 'Times New Roman';
  const fontSize = (metadata.fontSize || 12) * 2; // docx uses half-points
  const lineSpacing = Math.round((metadata.lineSpacing || 1.5) * 240);

  const children = [];

  // ─── Document Title ───
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          font: fontFamily,
          size: 38, // 19pt
          color: '000000',
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 360 },
    })
  );

  // ─── Sections ───
  for (const section of sections) {
    const { heading, level = 2, type, content, headers, rows } = section;

    // Section heading
    if (heading) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: heading,
              bold: true,
              font: fontFamily,
              size: level === 1 ? 30 : level === 2 ? 26 : 24,
              color: '000000',
            }),
          ],
          heading: HEADING_MAP[level] || HeadingLevel.HEADING_2,
          spacing: { before: 260, after: 120 },
        })
      );
    }

    if (type === 'heading_only') continue;

    // Paragraph (handles multi-paragraph strings)
    if (type === 'paragraph' && content) {
      const paragraphs = String(content).split(/\n\n+/);
      for (const p of paragraphs) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: p.trim(),
                font: fontFamily,
                size: fontSize,
              }),
            ],
            spacing: { after: 180, line: lineSpacing },
          })
        );
      }
    }

    // Bullet list
    if (type === 'bullets' && Array.isArray(content)) {
      for (const item of content) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: String(item), font: fontFamily, size: fontSize })],
            bullet: { level: 0 },
            spacing: { after: 80, line: lineSpacing },
          })
        );
      }
    }

    // Numbered list
    if (type === 'numbered' && Array.isArray(content)) {
      for (const item of content) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: String(item), font: fontFamily, size: fontSize })],
            numbering: { reference: 'default-numbering', level: 0 },
            spacing: { after: 80, line: lineSpacing },
          })
        );
      }
    }

    // Table
    if (type === 'table') {
      children.push(buildTable(headers, rows, fontFamily));
      children.push(new Paragraph({ spacing: { after: 200 } })); // spacer
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: { left: convertInchesToTwip(0.5), hanging: convertInchesToTwip(0.25) },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

module.exports = { generateDocx };
