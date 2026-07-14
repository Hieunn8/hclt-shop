export default ({ env }: { env: EnvHelper }) => {
  const uploadProvider = env("UPLOAD_PROVIDER", "local");

  if (uploadProvider === "cloudinary") {
    return {
      upload: {
        config: {
          provider: "cloudinary",
          providerOptions: {
            cloud_name: env("CLOUDINARY_NAME"),
            api_key: env("CLOUDINARY_KEY"),
            api_secret: env("CLOUDINARY_SECRET")
          }
        }
      }
    };
  }

  return {
    upload: {
      config: {
        sizeLimit: env.int("UPLOAD_SIZE_LIMIT", 10 * 1024 * 1024),
        provider: "local"
      }
    }
  };
};

type EnvHelper = {
  (key: string, defaultValue?: string): string;
  int(key: string, defaultValue?: number): number;
};
