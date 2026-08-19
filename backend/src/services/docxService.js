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
  ShadingType,
  convertInchesToTwip,
} = require('docx');

// ─── Heading level mapping ───
const HEADING_MAP = {
  1: HeadingLevel.HEADING_1,
  2: HeadingLevel.HEADING_2,
  3: HeadingLevel.HEADING_3,
};

/**
 * Build a styled table from headers and rows.
 */
function buildTable(headers, rows) {
  // Header row
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(
      (h) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text: String(h), bold: true, color: '000000', font: 'Times New Roman', size: 24 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
        })
    ),
  });

  // Data rows
  const dataRows = (rows || []).map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: String(cell), font: 'Times New Roman', size: 24, color: '000000' })],
                }),
              ],
              width: { size: Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
            })
        ),
      })
  );

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
 * Convert Claude's document JSON into a .docx Buffer.
 *
 * @param {object} docJSON - Claude's structured document output
 * @returns {Promise<Buffer>} The generated .docx file as a Buffer
 */
async function generateDocx(docJSON) {
  const { title, metadata = {}, sections = [] } = docJSON;

  const fontFamily = metadata.font || 'Times New Roman';
  const fontSize = (metadata.fontSize || 12) * 2; // docx uses half-points
  const lineSpacing = Math.round((metadata.lineSpacing || 1.5) * 240);

  const children = [];

  // ─── Title ───
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          font: fontFamily,
          size: 40, // 20pt
          color: '000000',
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
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
              size: level === 1 ? 32 : level === 2 ? 26 : 24,
              color: '000000',
            }),
          ],
          heading: HEADING_MAP[level] || HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
        })
      );
    }

    if (type === 'heading_only') continue;

    // Paragraph
    if (type === 'paragraph' && typeof content === 'string') {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: content,
              font: fontFamily,
              size: fontSize,
            }),
          ],
          spacing: { after: 200, line: lineSpacing },
        })
      );
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
    if (type === 'table' && Array.isArray(headers)) {
      children.push(buildTable(headers, rows));
      children.push(new Paragraph({ spacing: { after: 200 } })); // spacer after table
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

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = { generateDocx };
