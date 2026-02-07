// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "tof-checkout",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    new sst.aws.Nextjs("MyWeb", {
      environment: {
        WP_SITE_URL: process.env.WP_SITE_URL!,
        WP_CONSUMER_KEY: process.env.WP_CONSUMER_KEY!,
        WP_CONSUMER_SECRET: process.env.WP_CONSUMER_SECRET!,
        NEWSLETTER_CLIENT_ID: process.env.NEWSLETTER_CLIENT_ID!,
        NEWSLETTER_CLIENT_SECRET: process.env.NEWSLETTER_CLIENT_SECRET!,
        BRIDGER_PAY_ACTIVATION_KEY: process.env.BRIDGER_PAY_ACTIVATION_KEY!,
        BRIDGER_PAY_USERNAME: process.env.BRIDGER_PAY_USERNAME!,
        BRIDGER_PAY_PASSWORD: process.env.BRIDGER_PAY_PASSWORD!,
        BRIDGER_PAY_API_KEY: process.env.BRIDGER_PAY_API_KEY!,
        BRIDGER_PAY_CASHIER_KEY: process.env.BRIDGER_PAY_CASHIER_KEY!,
        BRIDGER_PAY_API_URL: process.env.BRIDGER_PAY_API_URL!,
        BRIDGER_PAY_EMBED_URL: process.env.BRIDGER_PAY_EMBED_URL!,
        SSM_AWS_KEY: process.env.SSM_AWS_KEY!,
        SSM_AWS_PRIVATE_KEY: process.env.SSM_AWS_PRIVATE_KEY!,
        APP_DEBUG: "false",
        AUTH_SECRET: process.env.AUTH_SECRET!,
        INTERNAL_API_TOKEN: process.env.INTERNAL_API_TOKEN!,
      },
      server: {
        runtime: "nodejs22.x",
      }
    });
  },
});
