const { test, describe } = require('node:test');
const assert = require('node:assert');
const { normalizeDocumentJSON } = require('../src/services/documentNormalizer');
const { extractJSONString } = require('../src/services/ollamaService');
const { generateDocx } = require('../src/services/docxService');
const { generatePdf } = require('../src/services/pdfService');

describe('Document Normalizer', () => {
  test('handles clean valid document', () => {
    const raw = {
      title: 'Valid Document',
      metadata: { font: 'Times New Roman', fontSize: 12, lineSpacing: 1.5 },
      sections: [
        { heading: 'Intro', level: 1, type: 'paragraph', content: 'Sample text.' },
      ],
    };
    const norm = normalizeDocumentJSON(raw);
    assert.strictEqual(norm.title, 'Valid Document');
    assert.strictEqual(norm.sections.length, 1);
    assert.strictEqual(norm.sections[0].type, 'paragraph');
    assert.strictEqual(norm.stats.wordCount, 2);
  });

  test('unwraps nested root wrappers (document / data / result)', () => {
    const wrapped = {
      document: {
        title: 'Unwrapped Title',
        sections: [{ heading: 'H1', level: 1, type: 'text', content: 'Wrapped content.' }],
      },
    };
    const norm = normalizeDocumentJSON(wrapped);
    assert.strictEqual(norm.title, 'Unwrapped Title');
    assert.strictEqual(norm.sections[0].type, 'paragraph');
  });

  test('normalizes table with object rows and mismatched columns without crashing', () => {
    const tableDoc = {
      title: 'Table Test',
      sections: [
        {
          heading: 'Action Items',
          type: 'table',
          headers: ['Task', 'Owner', 'Deadline'],
          rows: [
            { Task: 'Fix Bugs', Owner: 'Alice' }, // missing Deadline
            ['Code Review', 'Bob', 'Friday', 'Extra Cell'], // extra cell
            'Simple string item', // primitive
          ],
        },
      ],
    };
    const norm = normalizeDocumentJSON(tableDoc);
    const tableSection = norm.sections[0];
    assert.strictEqual(tableSection.type, 'table');
    assert.strictEqual(tableSection.headers.length, 3);
    assert.strictEqual(tableSection.rows.length, 3);
    // Every row must have exactly 3 columns
    for (const r of tableSection.rows) {
      assert.strictEqual(r.length, 3);
    }
  });

  test('normalizes string bullets and array paragraphs', () => {
    const mixedDoc = {
      title: 'Mixed Content',
      sections: [
        { heading: 'Para as Array', type: 'paragraph', content: ['First line', 'Second line'] },
        { heading: 'Bullets as String', type: 'bullet', content: '• Item A\n• Item B\n• Item C' },
      ],
    };
    const norm = normalizeDocumentJSON(mixedDoc);
    assert.strictEqual(norm.sections[0].content, 'First line\n\nSecond line');
    assert.deepStrictEqual(norm.sections[1].content, ['Item A', 'Item B', 'Item C']);
  });
});

describe('JSON Extraction from LLM Output', () => {
  test('strips reasoning/thinking tags', () => {
    const raw = '<think>I should generate a report about economics</think>{"title": "Econ 101", "sections": []}';
    const extracted = extractJSONString(raw);
    assert.strictEqual(extracted, '{"title": "Econ 101", "sections": []}');
  });

  test('extracts from markdown code fence with surrounding preamble and postscript', () => {
    const raw = 'Here is your generated document:\n```json\n{"title": "Report", "sections": []}\n```\nLet me know if you need edits!';
    const extracted = extractJSONString(raw);
    assert.strictEqual(extracted, '{"title": "Report", "sections": []}');
  });
});

describe('DOCX & PDF Generators', () => {
  test('generates valid docx buffer from complex document', async () => {
    const doc = {
      title: 'Comprehensive DOCX',
      sections: [
        { heading: 'Intro', level: 1, type: 'paragraph', content: 'Paragraph one.' },
        { heading: 'Key Points', level: 2, type: 'bullets', content: ['Alpha', 'Beta'] },
        { heading: 'Data', level: 2, type: 'table', headers: ['Metric', 'Value'], rows: [['Latency', '5ms']] },
      ],
    };
    const buffer = await generateDocx(doc);
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 1000);
  });

  test('generates valid pdf buffer from complex document with tables', async () => {
    const doc = {
      title: 'Comprehensive PDF',
      sections: [
        { heading: 'Overview', level: 1, type: 'paragraph', content: 'PDF paragraph text.' },
        { heading: 'Steps', level: 2, type: 'numbered', content: ['Step 1', 'Step 2'] },
        { heading: 'Matrix', level: 2, type: 'table', headers: ['Col A', 'Col B'], rows: [{ 'Col A': '1', 'Col B': '2' }] },
      ],
    };
    const buffer = await generatePdf(doc);
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 1000);
  });
});
