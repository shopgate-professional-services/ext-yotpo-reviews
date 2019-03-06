# ext-yotpo-reviews
Allows customers to leave and read yotpo reviews for merchant's products. In order to enable Yotpo reviews you must configure the yotpo app key in your connect admin. The input takes the merchant's app key as a string.

## Configuration
Add the yotpo-reviews extension to your Shopgate Connect deployment config.
```
(...)
  {
    "id": "@shopgate-project/yotpo-reviews",
    "version": "1.0.0"
  }
(...)
```
Set the following value in your Shopgate Connect Admin:
* yotpoAppKey - (string) Merchants app key provided my Yotpo.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) file for more information.

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) file for more information.

## About Shopgate

Shopgate is the leading mobile commerce platform.

Shopgate offers everything online retailers need to be successful in mobile. Our leading
software-as-a-service (SaaS) enables online stores to easily create, maintain and optimize native
apps and mobile websites for the iPhone, iPad, Android smartphones and tablets.

## License

This extension is available under the Apache License, Version 2.0.

See the [LICENSE](./LICENSE) file for more information.
