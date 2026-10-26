export const config = {
  port: Number(process.env.PORT ?? 4000),
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'moneymind',
  },
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-no-usar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
  gemini: {
    apiKey: process.env.GEMINI_API_KEY ?? '',
    model: process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite',
    timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS ?? 5000),
    // Vacío = el modelo decide. 0 = sin razonamiento (más rápido); si el modelo no lo acepta, déjalo vacío.
    thinkingBudget:
      process.env.GEMINI_THINKING_BUDGET === undefined || process.env.GEMINI_THINKING_BUDGET === ''
        ? null
        : Number(process.env.GEMINI_THINKING_BUDGET),
  },
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
};
