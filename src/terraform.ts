import { isObject, isString } from "util";

class CData {
  constructor(public name: string, public data: {}) {}
}

const toString = (cd: CData) => `<<${cd.name}\n${JSON.stringify(cd.data, undefined, 2)}\n${cd.name}`;

export const cdata = (name: string, content: {}): {} => new CData(name, content);

const writeAssignment = (varName: string | undefined) => {
  if (varName !== undefined) {
    return " = ";
  }
  return "";
};

type BaseNode = CData | { [key: string]: BaseNode };

type Node = BaseNode | BaseNode[];

const writeVar = (indent: string = "", varName: string | undefined, b: Node) => {
  let str: string = "";
  str += `${indent}${varName || ""}`;
  if (b instanceof CData) {
    str += writeAssignment(varName);
    str += toString(b);
  } else if (Array.isArray(b)) {
    str += writeAssignment(varName);
    str += "[";
    b.forEach(item => {
      str += `\n${writeVar(`${indent}  `, undefined, item)},`;
    });
    str += `\n${indent}]`;
  } else if (isObject(b)) {
    str += " {\n";
    Object.keys(b).forEach(key => {
      str += writeVar(`${indent}  `, `${key}`, b[key]);
      str += "\n";
    });
    str += `${indent}}`;
  } else if (isString(b)) {
    str += writeAssignment(varName);
    str += `\"${b}\"`;
  } else {
    str += writeAssignment(varName);
    str += b;
  }
  return str;
};

let buffer: string = "";

const writeLine = (str: string) => {
  buffer += str;
  buffer += "\n";
};

export const resource = (resourceType: string, resourceIdRaw: string, definition: any) => {
  const resourceId = resourceIdRaw.replace(/\./g, "_");
  writeLine(writeVar("", `resource \"${resourceType}\" \"${resourceId}\"`, definition));
  writeLine("");
  return { id: resourceId };
};

export const user_var = (name: string, definition: any) => {
  writeLine(writeVar("", name, definition));
};

type Policy = any;
type Record = ARecord | CNameRecord;

interface AwsS3Bucket {
  bucket: string;
  acl: string;
  website?: {
    index_document: string;
    error_document: string;
  };
  tags?: { [key: string]: string };
  policy?: Policy;
}

interface AwsRoute53HostedZone {
  name: string;
  records?: Record[];
}

interface AwsCloudfrontDistribution {}

interface ARecord {
  name: string;
  type: "A";
  alias: {
    zone_id: string;
    name: string;
    evaluate_target_health: boolean;
  };
}

interface CNameRecord {
  name: string;
  type: "CNAME";
  ttl: string;
  records: string[];
}

type AwsRoute53Record = Record & { zone_id: string };

export const aws_s3_bucket = (id: string, params: AwsS3Bucket) => resource("aws_s3_bucket", id, params);

export const aws_route53_zone = (id: string, params: AwsRoute53HostedZone) => {
  const zone = resource("aws_route53_zone", id, { name: params.name });
  if (params.records) {
    params.records.forEach(record => {
      resource("aws_route53_record", record.name.replace(/\./g, "_"), {
        zone_id: `\${aws_route53_zone.${id}.zone_id}`,
        ...record,
      });
    });
  }
  return zone;
};

export const aws_route53_record = (id: string, params: AwsRoute53Record) => resource("aws_route53_record", id, params);

export const aws_cloudfront_distribution = (id: string, params: AwsCloudfrontDistribution) =>
  resource("aws_cloudfront_distribution", id, params);

export const flush = () => {
  const g = buffer;
  buffer = "";
  return g;
};

export const aws_dynamodb_table = (name: string) =>
  resource("aws_dynamodb_table", name, {
    name,
    read_capacity: 0,
    write_capacity: 0,
    hash_key: "id",
    attribute: [
      {
        name: "id",
        type: "S",
      },
    ],
    stream_enabled: false,
    /*
    ttl: {
      attribute_name: "TimeToExist",
      enabled: false,
    },

    global_secondary_index: {
      name: "GameTitleIndex",
      hash_key: "GameTitle",
      range_key: "TopScore",
      write_capacity: 10,
      read_capacity: 10,
      projection_type: "INCLUDE",
      non_key_attributes: ["UserId"],
    },
    tags: {
      Name: "dynamodb-table-1",
      Environment: "production",
    },
  */
  });
