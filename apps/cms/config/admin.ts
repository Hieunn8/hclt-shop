export default ({ env }: { env: EnvHelper }) => ({
  auth: {
    secret: env("ADMIN_JWT_SECRET", "local-admin-jwt-secret")
  },
  apiToken: {
    salt: env("API_TOKEN_SALT", "local-api-token-salt")
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT", "local-transfer-token-salt")
    }
  },
  secrets: {
    encryptionKey: env("ENCRYPTION_KEY", "local-encryption-key-32-characters")
  },
  url: env("ADMIN_URL", "/admin")
});

type EnvHelper = {
  (key: string, defaultValue?: string): string;
};
