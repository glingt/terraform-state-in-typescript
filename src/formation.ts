import {
  aws_s3_bucket,
  aws_route53_zone,
  aws_cloudfront_distribution,
  aws_route53_record,
  cdata,
  user_var,
} from "./terraform";

export const domain = (name: string) => {
  aws_route53_zone(name, {
    name,
  });
};

export const cloudfront_distribution = (sourceBucket: { id: string }, subdomain: string, certArn?: string) => {
  const s3_origin_name = `${sourceBucket.id}_origin`;

  user_var("locals", {
    [s3_origin_name]: s3_origin_name,
  });

  const origin = {
    // domain_name: `\${aws_s3_bucket.${sourceBucket.id}.bucket_regional_domain_name}`,
    domain_name: `\${aws_s3_bucket.${sourceBucket.id}.website_endpoint}`,
    origin_id: `\${local.${s3_origin_name}}`,
    custom_origin_config: {
      origin_protocol_policy: "http-only",
      origin_ssl_protocols: ["TLSv1", "TLSv1.1", "TLSv1.2"],
      http_port: 80,
      https_port: 443,
    },
  };

  return aws_cloudfront_distribution(subdomain, {
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
    tags: {
      Environment: "production",
    },
    viewer_certificate: certArn
      ? {
          ssl_support_method: "sni-only",
          acm_certificate_arn: certArn,
          minimum_protocol_version: "TLSv1.1_2016",
        }
      : {
          cloudfront_default_certificate: true,
          ssl_support_method: "sni-only",
        },
  });
};

export const static_site = (subdomain: string, certArn?: string) => {
  const parts = subdomain.split(/\./g);
  const mainDomain = parts.slice(1).join(".");

  const bucket = aws_s3_bucket(subdomain, {
    bucket: subdomain,
    acl: "private",
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

  const distribution = cloudfront_distribution(bucket, subdomain, certArn);

  aws_route53_record(subdomain, {
    zone_id: `\${aws_route53_zone.${mainDomain.replace(/\./g, "_")}.zone_id}`,
    name: subdomain,
    type: "A",
    alias: {
      zone_id: "Z2FDTNDATAQYW2",
      name: `\${aws_cloudfront_distribution.${distribution.id}.domain_name}`,
      evaluate_target_health: true,
    },
  });
};
