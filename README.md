# terraform-state-in-typescript

Define your Terraform state in Typescript

## Usage

1. Write a Terraform definition in Typescript, using your custom building blocks.

```
// my-infrastructure.ts

import { compositeElement, resource } from "terraform-state-in-typescript";

// Define your custom building blocks
const domain = (id: string, name: string) =>
  resource("aws_route53_zone", id, { name });

const storage = (id: string, name: string) =>
  resource("aws_s3_bucket", id, { name });

const cdn = (id: string, domain: string) =>
  resource("aws_cloudfront_distribution", id, { alias: [domain] });

const website = (id: string, address: string) =>
  compositeElement(
    domain(id, address),
    storage(id, address),
    cdn(id, address)
  );

// Export your infrastructure
export default compositeElement(
   website("my_primary_website", "example.com"),
   website("my_customer_portal", "example2.com"),
)

```

2. Add a line to your package.json

```
// package.json

"scripts": {
    "build": "terraform-state-in-typescript ./src/my-infrastructure.ts ./my-infrastructure.tf",
    ...
  },
```

3. Transpile your Typescript infrastructure to Terraform and execute

```
// command window
> yarn build
> terraform apply
```

Done! You have deployed two websites in the cloud!
