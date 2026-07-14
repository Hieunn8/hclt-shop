export default ({ env }: { env: EnvHelper }) => {
  const client = env("DATABASE_CLIENT", "sqlite");

  if (client === "postgres") {
    const isProductionHost = env("DATABASE_HOST", "") === "13.140.130.137";
    if (isProductionHost && !env.bool("ALLOW_PRODUCTION_DB", false)) {
      throw new Error("Refusing production database host without ALLOW_PRODUCTION_DB=true");
    }

    return {
      connection: {
        client: "postgres",
        connection: {
          host: env("DATABASE_HOST"),
          port: env.int("DATABASE_PORT", 5432),
          database: env("DATABASE_NAME"),
          user: env("DATABASE_USERNAME"),
          password: env("DATABASE_PASSWORD"),
          ssl: env.bool("DATABASE_SSL", false)
        },
        pool: {
          min: env.int("DATABASE_POOL_MIN", 0),
          max: env.int("DATABASE_POOL_MAX", 10)
        }
      }
    };
  }

  return {
    connection: {
      client: "sqlite",
      connection: {
        filename: env("DATABASE_FILENAME", ".tmp/data.db")
      },
      useNullAsDefault: true
    }
  };
};

type EnvHelper = {
  (key: string, defaultValue?: string): string;
  int(key: string, defaultValue?: number): number;
  bool(key: string, defaultValue?: boolean): boolean;
};
