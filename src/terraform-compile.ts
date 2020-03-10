import * as fs from "fs";
import * as path from "path";
import * as tsnode from "ts-node";
import { TerraformElement } from "./terraform";
import { createFileContent } from "./terraform-generator";

tsnode.register({
  /* options */
});

const sourceFile = process.argv[process.argv.length - 2];
const outputFile = process.argv[process.argv.length - 1];

if (!sourceFile) {
  throw new Error("No terraform ts files found.");
}

const file = path.resolve(sourceFile);
console.log(file);

let buffer: string = "";

const element: TerraformElement = require(file).default;
buffer += createFileContent(element);
buffer += "\n";
fs.writeFileSync(outputFile, buffer);
