// Copy the values of _DEV environment variables from .env to .env.development

const envFile = await Deno.readTextFile(".env");
const clientEnvProdFile = await Deno.readTextFile("client/.env.production");

const getIsLineWithVar = (line: string) => line.trim() && !/^#/.test(line) && line.includes("=");
const removeComments = (line: string) => line.replace(/ *#.*$/, "");

const envLines = envFile.split("\n").filter(getIsLineWithVar).map(removeComments);
let output = `PORT=${envLines.find((line) => /^FRONTEND_PORT=/.test(line))?.replace("FRONTEND_PORT=", "")}\n`;

for (const line of clientEnvProdFile.split("\n").filter(getIsLineWithVar).map(removeComments)) {
  const [envProdVar, envProdValue] = line.split("=");

  if (envProdValue.charAt(0) === "$") {
    for (const envLine of envLines) {
      const [envVar, envValue] = envLine.split("=");

      if ("$" + envVar.replace(/_DEV$/, "") === envProdValue) {
        output += `${envProdVar}=${envValue}\n`;
        break;
      }
    }
  }
}

await Deno.writeTextFile("./client/.env.development", output);
