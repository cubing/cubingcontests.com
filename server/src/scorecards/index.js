const path = require('path');
const PdfPrinter = require('pdfmake');

const fonts = {
  Roboto: {
    // The paths are like this cause of the dist structure after the Nest build step
    normal: path.resolve('./dist/scorecards/fonts/Roboto-Regular.ttf'),
    bold: path.resolve('./dist/scorecards/fonts/Roboto-Medium.ttf'),
    italics: path.resolve('./dist/scorecards/fonts/Roboto-Italic.ttf'),
    bolditalics: path.resolve('./dist/scorecards/fonts/Roboto-MediumItalic.ttf'),
  },
};

const printer = new PdfPrinter(fonts);

export const getScorecards = async (contestName, event, round, timeLimit) => {
  const getSingleScorecard = () => [
    { text: contestName, fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 20] },
    {
      layout: 'noBorders',
      table: {
        headerRows: 0,
        widths: ['75%', '25%'],
        body: [
          [
            { text: event, fontSize: 12 },
            { text: `Round ${round}`, fontSize: 12 },
          ],
        ],
      },
      margin: [15, 0, 0, 8],
    },
    {
      table: {
        widths: ['100%'],
        body: [[{ text: '', margin: [0, 0, 0, 26] }]],
      },
      margin: [6, 0, 0, 16],
    },
    {
      table: {
        headerRows: 1,
        widths: ['7%', '16%', '45%', '16%', '16%'],
        body: [
          [
            { text: '', border: [false, false, false, false] },
            { text: 'Scr', style: 'colHeader', border: [false, false, false, false] },
            { text: 'Result', style: 'colHeader', border: [false, false, false, false] },
            { text: 'Judge', style: 'colHeader', border: [false, false, false, false] },
            { text: 'Comp', style: 'colHeader', border: [false, false, false, false] },
          ],
          [{ text: '1', style: 'rowNumber', border: [false, false, false, false] }, '', '', '', ''],
          [{ text: '2', style: 'rowNumber', border: [false, false, false, false] }, '', '', '', ''],
          [{ text: '3', style: 'rowNumber', border: [false, false, false, false] }, '', '', '', ''],
          [{ text: '4', style: 'rowNumber', border: [false, false, false, false] }, '', '', '', ''],
          [{ text: '5', style: 'rowNumber', border: [false, false, false, false] }, '', '', '', ''],
          [{ text: 'E', style: 'rowNumber', border: [false, false, false, false] }, '', '', '', ''],
        ],
      },
    },
    {
      text: `Time limit: ${timeLimit}`,
      margin: [22, 10, 0, 35],
    },
  ];

  const docDefinition = {
    content: [
      {
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: ['48%', '4%', '48%'],
          body: [
            [getSingleScorecard(), '', getSingleScorecard()],
            [getSingleScorecard(), '', getSingleScorecard()],
          ],
        },
      },
    ],
    defaultStyle: {
      font: 'Roboto',
    },
    styles: {
      rowNumber: {
        fontSize: 20,
        bold: true,
        lineHeight: 1.2,
      },
      colHeader: {
        margin: [0, 0, 0, 4],
        alignment: 'center',
        fontSize: 10,
      },
    },
  };

  const options = {};

  const pdfDoc = printer.createPdfKitDocument(docDefinition, options);
  pdfDoc.end();

  const pdfBuffer = await new Promise((resolve) => {
    const buffer = [];

    pdfDoc.on('data', buffer.push.bind(buffer));
    pdfDoc.on('end', () => {
      const data = Buffer.concat(buffer);
      resolve(data);
    });
  });

  return pdfBuffer;
};
