import * as fs from "fs";
import { flush } from "./terraform";
// import { exec } from 'child_process';
// import { promisify } from 'util';

// const execAsync = promisify(exec);

const files = fs.readdirSync("./terraform-ts").filter(file => file.endsWith(".tf.ts"));

if (files.length === 0) {
  throw new Error("No terraform ts files found.");
}

files.forEach(file => {
  console.log(file);
  require("../terraform-ts/" + file);
  const outputFile = "./terraform/" + file.substr(0, file.length - 6) + ".generated.tf";
  const fileContent = flush();
  fs.writeFileSync(outputFile, fileContent);
});

// execAsync("terraform plan");
