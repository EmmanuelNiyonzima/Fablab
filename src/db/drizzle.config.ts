import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.SQL_HOST || '/app/cloudsql/festive-order-r4dh4:europe-west2:ai-studio-0150a5c6',
    user: process.env.SQL_USER || 'ai_studio_app_user',
    password: process.env.SQL_PASSWORD || '#Fh^lB`Dv6:f3#De',
    database: process.env.SQL_DB_NAME || 'cloud_sql_development_database',
  },
});
