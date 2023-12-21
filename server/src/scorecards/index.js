const path = require('path');
const PdfPrinter = require('pdfmake');
const Helpers = require('@wca/helpers');

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

/**
 * Gets a PDF with all scorecards for a competition
 *
 * @param {*} wcifCompetition Competition object in WCIF format (see https://github.com/thewca/wcif/blob/master/specification.md)
 */
const getScorecards = async (wcifCompetition) => {
  const getSingleScorecard = ({ round, roundNumber, event }) => {
    const eventExt = event.extensions.find((e) => e.id === 'TEMPORARY')?.data;

    return [
      { text: wcifCompetition.name, fontSize: 16, bold: true, alignment: 'center', margin: [0, 0, 0, 10] },
      {
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: ['75%', '25%'],
          body: [
            [
              { text: eventExt?.name, fontSize: 10 },
              { text: `Round ${roundNumber}`, fontSize: 10 },
            ],
          ],
        },
        margin: [15, 0, 0, 7],
      },
      eventExt.participants < 3
        ? {
            text: eventExt.participants === 1 ? 'Full Name' : 'Full Names',
            bold: true,
            fontSize: 12,
            margin: [4, eventExt.participants === 1 ? 6 : 3, 0, 0],
          }
        : undefined,
      {
        table: {
          widths: ['100%'],
          // Use as many name fields as there are participants in this event
          body: new Array(eventExt.participants).fill([
            { text: '', margin: [0, 0, 0, eventExt.participants === 1 ? 30 : eventExt.participants === 2 ? 24 : 22] },
          ]),
        },
        margin: [
          4,
          eventExt.participants < 3 ? 8 : 4,
          0,
          eventExt.participants === 1 ? 20 : eventExt.participants === 2 ? 10 : 8,
        ],
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
        layout: 'noBorders',
        table: {
          headerRows: 0,
          widths: ['55%', '45%'],
          body: [
            [
              {
                text: round.timeLimit ? `Time limit: ${Helpers.formatCentiseconds(round.timeLimit.centiseconds)}` : '',
                fontSize: 11,
              },
              {
                text: round.cutoff ? `Cutoff: ${Helpers.formatCentiseconds(round.cutoff.attemptResult)}` : '',
                fontSize: 11,
                alignment: 'right',
              },
            ],
          ],
        },
        margin: [22, eventExt.participants === 1 ? 14 : 8, 0, 30],
      },
    ];
  };

  const roundObjects = [];

  for (const event of wcifCompetition.events) {
    for (let i = 0; i < event.rounds.length; i++) {
      roundObjects.push({
        roundNumber: i + 1,
        round: event.rounds[i],
        event,
      });
    }
  }

  const docDefinition = {
    content: roundObjects.map((roundObj, index) => ({
      layout: 'noBorders',
      table: {
        headerRows: 0,
        widths: ['48%', '4%', '48%'],
        body: [
          [getSingleScorecard(roundObj), '', getSingleScorecard(roundObj)],
          [getSingleScorecard(roundObj), '', getSingleScorecard(roundObj)],
        ],
      },
      pageBreak: index + 1 === roundObjects.length ? '' : 'after',
    })),
    defaultStyle: {
      font: 'Roboto',
    },
    styles: {
      rowNumber: {
        fontSize: 18,
        bold: true,
        lineHeight: 1.1,
      },
      colHeader: {
        margin: [0, 0, 0, 3],
        alignment: 'center',
        fontSize: 8,
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

module.exports = {
  getScorecards,
};
