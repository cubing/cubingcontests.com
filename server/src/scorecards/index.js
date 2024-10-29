const path = require("path");
const PdfPrinter = require("pdfmake");
const Helpers = require("@wca/helpers");

const fonts = {
  Roboto: {
    // The paths are like this cause of the dist structure after the Nest build step
    normal: path.resolve("./dist/scorecards/fonts/Roboto-Regular.ttf"),
    bold: path.resolve("./dist/scorecards/fonts/Roboto-Medium.ttf"),
    italics: path.resolve("./dist/scorecards/fonts/Roboto-Italic.ttf"),
    bolditalics: path.resolve("./dist/scorecards/fonts/Roboto-MediumItalic.ttf"),
  },
};

const printer = new PdfPrinter(fonts);

const getRoundAttempts = (format) => {
  if (format === "a") return 5;
  if (format === "m") return 3;
  return parseInt(format); // handles '1', '2', and '3'
};

/**
 * Gets a PDF with all scorecards for a competition
 *
 * @param {*} wcifCompetition Competition object in WCIF format (see https://github.com/thewca/wcif/blob/master/specification.md)
 */
const getScorecards = async (wcifCompetition) => {
  const getSingleScorecard = ({ round, roundNumber, event }) => {
    const eventExt = event.extensions.find((e) => e.id === "TEMPORARY")?.data;

    return [
      { text: wcifCompetition.shortName, fontSize: 15, bold: true, alignment: "center", margin: [0, 0, 0, 10] },
      {
        layout: "noBorders",
        table: {
          headerRows: 0,
          widths: ["75%", "25%"],
          body: [
            [
              { text: eventExt?.name, fontSize: 10 },
              { text: `Round ${roundNumber}`, fontSize: 10 },
            ],
          ],
        },
        margin: [9, 0, 0, 7],
      },
      {
        table: {
          headerRows: 1,
          widths: ["30%", "70%"],
          body: [
            [
              {
                text: "WCA ID",
                fontSize: 10,
                border: [false, false, false, false],
                margin: [0, 0, 0, 5],
              },
              {
                text: "Full Name",
                fontSize: 10,
                border: [false, false, false, false],
              },
            ],
            ...new Array(eventExt.participants).fill([{ text: "", margin: [0, 0, 0, 20] }, { text: "" }]),
          ],
        },
        margin: [4, 3, 0, 16],
      },
      {
        table: {
          headerRows: 1,
          widths: ["7%", "16%", "45%", "16%", "16%"],
          body: [
            [
              { text: "", border: [false, false, false, false] },
              { text: "Scr", style: "colHeader", border: [false, false, false, false] },
              { text: "Result", style: "colHeader", border: [false, false, false, false] },
              { text: "Judge", style: "colHeader", border: [false, false, false, false] },
              { text: "Comp", style: "colHeader", border: [false, false, false, false] },
            ],
            ...new Array(getRoundAttempts(round.format))
              .fill("")
              .map((_, index) => [
                { text: (index + 1).toString(), style: "rowNumber", border: [false, false, false, false] },
                "",
                "",
                "",
                "",
              ]),
            [{ text: "E", style: "rowNumber", border: [false, false, false, false] }, "", "", "", ""],
          ],
        },
      },
      {
        layout: "noBorders",
        table: {
          headerRows: 0,
          widths: ["55%", "45%"],
          body: [
            [
              {
                text: round.timeLimit ? `Time limit: ${Helpers.formatCentiseconds(round.timeLimit.centiseconds)}` : "",
                fontSize: 11,
              },
              {
                text: round.cutoff ? `Cutoff: ${Helpers.formatCentiseconds(round.cutoff.attemptResult)}` : "",
                fontSize: 11,
                alignment: "right",
              },
            ],
          ],
        },
        margin: [22, eventExt.participants === 1 ? 20 : 8, 0, round.format === "a" ? 40 : 80],
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
      layout: "noBorders",
      table: {
        headerRows: 0,
        widths: ["48%", "4%", "48%"],
        body: [
          [getSingleScorecard(roundObj), "", getSingleScorecard(roundObj)],
          [getSingleScorecard(roundObj), "", getSingleScorecard(roundObj)],
        ],
      },
      pageBreak: index + 1 === roundObjects.length ? "" : "after",
    })),
    defaultStyle: {
      font: "Roboto",
    },
    styles: {
      rowNumber: {
        fontSize: 18,
        bold: true,
        lineHeight: 1.1,
      },
      colHeader: {
        margin: [0, 0, 0, 3],
        alignment: "center",
        fontSize: 8,
      },
    },
  };

  const options = {};

  const pdfDoc = printer.createPdfKitDocument(docDefinition, options);
  pdfDoc.end();

  const pdfBuffer = await new Promise((resolve) => {
    const buffer = [];

    pdfDoc.on("data", buffer.push.bind(buffer));
    pdfDoc.on("end", () => {
      const data = Buffer.concat(buffer);
      resolve(data);
    });
  });

  return pdfBuffer;
};

module.exports = {
  getScorecards,
};
