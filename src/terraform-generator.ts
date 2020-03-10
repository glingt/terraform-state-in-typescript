import { TerraformElement, CData, Node } from "./terraform";
import { isObject, isString } from "util";

const toString = (cd: CData) => `<<${cd.name}\n${JSON.stringify(cd.data, undefined, 2)}\n${cd.name}`;

const writeAssignment = (varName: string | undefined) => {
  if (varName !== undefined) {
    return " = ";
  }
  return "";
};

const writeVar = (indent: string = "", varName: string | undefined, b: Node) => {
  let str: string = "";
  if (b instanceof CData) {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += toString(b);
  } else if (Array.isArray(b)) {
    if ((b as any).spread) {
      b.forEach(item => {
        str += `\n${writeVar(`${indent}`, varName, item)}`;
      });
    } else {
      str += `${indent}${varName || ""}`;
      str += writeAssignment(varName);
      str += "[";
      b.forEach(item => {
        str += `\n${writeVar(`${indent}  `, undefined, item)},`;
      });
      str += `\n${indent}]`;
    }
  } else if (isString(b)) {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += `\"${b}\"`;
  } else if (isObject(b)) {
    str += `${indent}${varName || ""}`;
    if (b["_isValue"]) {
      str += " = ";
    }
    str += " {\n";
    Object.keys(b)
      .filter(key => !key.startsWith("_"))
      .forEach(key => {
        str += writeVar(`${indent}  `, `${key}`, b[key]);
        str += "\n";
      });
    str += `${indent}}`;
  } else {
    str += `${indent}${varName || ""}`;
    str += writeAssignment(varName);
    str += b;
  }
  return str;
};

export const createFileContent = (element: TerraformElement): string => {
  switch (element.type) {
    case "composite":
      return element.elements.map(element => createFileContent(element)).join("\n");
    case "resource":
      return writeVar("", `resource \"${element.resourceType}\" \"${element.resourceId}\"`, element.definition);
    case "var":
      return writeVar("", element.name, element.definition);
  }
};
