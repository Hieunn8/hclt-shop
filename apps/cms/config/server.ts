export default ({ env }: { env: EnvHelper }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  url: env("PUBLIC_URL", "http://localhost:1337"),
  proxy: env.bool("PROXY", false),
  app: {
    keys: env.array("APP_KEYS", ["local-dev-key-a", "local-dev-key-b"])
  }
});

type EnvHelper = {
  (key: string, defaultValue?: string): string;
  int(key: string, defaultValue?: number): number;
  bool(key: string, defaultValue?: boolean): boolean;
  array(key: string, defaultValue?: string[]): string[];
};
