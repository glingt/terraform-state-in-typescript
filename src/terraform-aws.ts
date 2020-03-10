import {
  resource,
  ResourceElement,
  VarElement,
  user_var,
  compositeElement,
  asValue,
  multiple,
  cdata,
} from "./terraform";

type Policy = any;
type Record = ARecord | CNameRecord;

export type AwsS3Bucket = {
  bucket: string;

  website?: {
    index_document: string;
    error_document: string;
  };

  tags?: { [key: string]: string };
  policy?: Policy;
} & ({} | { acl: string } | { grant: object });

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

export const aws_route53_record = (id: string, params: AwsRoute53Record) => resource("aws_route53_record", id, params);

export const aws_cloudfront_distribution = (id: string, params: AwsCloudfrontDistribution) =>
  resource("aws_cloudfront_distribution", id, params);

export const aws_dynamodb_table = (name: string) =>
  resource("aws_dynamodb_table", name, {
    billing_mode: "PAY_PER_REQUEST",
    name,
    read_capacity: 0,
    write_capacity: 0,
    hash_key: "id",
    attribute: multiple({
      name: "id",
      type: "S",
    }),
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

export const domain = (name: string) => resource("aws_route53_zone", name, { name });

export const cloudfront_distribution = (
  sourceBucket: string,
  subdomain: string,
  certArn?: string,
): [ResourceElement, VarElement] => {
  const s3_origin_name = `${sourceBucket}_origin`;

  const locals = user_var("locals", {
    [s3_origin_name]: s3_origin_name,
  });

  const origin = {
    // domain_name: `\${aws_s3_bucket.${sourceBucket.id}.bucket_regional_domain_name}`,
    domain_name: `\${aws_s3_bucket.${sourceBucket}.website_endpoint}`,
    origin_id: `\${local.${s3_origin_name}}`,
    custom_origin_config: {
      origin_protocol_policy: "http-only",
      origin_ssl_protocols: ["TLSv1", "TLSv1.1", "TLSv1.2"],
      http_port: 80,
      https_port: 443,
    },
  };

  const cloudfront = aws_cloudfront_distribution(subdomain, {
    origin,
    enabled: true,
    is_ipv6_enabled: true,
    comment: "Managed by Terraform",
    default_root_object: "index.html",
    aliases: [subdomain],

    default_cache_behavior: {
      allowed_methods: ["GET", "HEAD"],
      cached_methods: ["GET", "HEAD"],
      target_origin_id: origin.origin_id,

      forwarded_values: {
        query_string: false,
        cookies: {
          forward: "none",
        },
      },
      viewer_protocol_policy: certArn ? "redirect-to-https" : "allow-all",
      min_ttl: 0,
      default_ttl: 3600,
      max_ttl: 86400,
    },

    price_class: "PriceClass_All",

    restrictions: {
      geo_restriction: {
        restriction_type: "whitelist",
        locations: ["US", "CA", "GB", "DE", "SE"],
      },
    },
    tags: asValue({
      Environment: "production",
    }),
    viewer_certificate: certArn
      ? {
          ssl_support_method: "sni-only",
          acm_certificate_arn: certArn,
          minimum_protocol_version: "TLSv1.1_2016",
        }
      : {
          cloudfront_default_certificate: true,
        },
  });

  return [cloudfront, locals];
};

export const static_site = (subdomain: string, certArn?: string, grants?: object[]) => {
  const parts = subdomain.split(/\./g);
  const mainDomain = parts.slice(1).join(".");

  const bucket = aws_s3_bucket(subdomain, {
    bucket: subdomain,
    ...(grants ? { grant: multiple(...grants) } : { acl: "private" }),
    website: {
      index_document: "index.html",
      error_document: "error.html",
    },
    policy: cdata("POLICY", {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "AddPerm",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${subdomain}/*`,
        },
      ],
    }),
  });

  const [distribution, locals] = cloudfront_distribution(bucket.resourceId, subdomain, certArn);

  const record = aws_route53_record(subdomain, {
    zone_id: `\${aws_route53_zone.${mainDomain.replace(/\./g, "_")}.zone_id}`,
    name: subdomain,
    type: "A",
    alias: {
      zone_id: "Z2FDTNDATAQYW2",
      name: `\${aws_cloudfront_distribution.${distribution.resourceId}.domain_name}`,
      evaluate_target_health: true,
    },
  });

  return compositeElement(bucket, distribution, locals, record);
};
