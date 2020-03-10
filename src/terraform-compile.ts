import * as fs from "fs";
import * as path from "path";
import * as tsnode from "ts-node";
import { TerraformElement } from "./terraform";
import { createFileContent } from "./terraform-generator";

tsnode.register({ /* options */ });

const files = fs.readdirSync("./terraform-ts").filter(file => file.endsWith(".tf.ts"));

if (files.length === 0) {
  throw new Error("No terraform ts files found.");
}

files.forEach(filename => {
  const file = path.resolve("./terraform-ts/", filename);
  console.log(file);

  let buffer: string = "";

  const element: TerraformElement = require(file).default;
  buffer += createFileContent(element);
  buffer += "\n";
  const outputFile = "./terraform/" + filename.substr(0, filename.length - 6) + ".generated.tf";
  fs.writeFileSync(outputFile, buffer);
});
