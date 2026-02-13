/**
 * Sequelize CLI configuration for different environments.
 * Dev: uses DATABASE_URL (Supabase/Postgres) when set, otherwise SQLite.
 * Prod: uses DATABASE_URL (Supabase/Postgres).
 * Same Supabase instance as mainbranchcloned/customer-loyalty-app can be used.
 */
module.exports = {
  development: {
    ...(process.env.DATABASE_URL
      ? {
          use_env_variable: 'DATABASE_URL',
          dialect: 'postgres',
          protocol: 'postgres',
          logging: false,
          dialectOptions: {
            ssl: process.env.PGSSL === '0' ? false : { require: true, rejectUnauthorized: false },
          },
        }
      : {
          dialect: 'sqlite',
          storage: process.env.SQLITE_STORAGE || './var/dev.sqlite',
          logging: false,
        }),
  },
  test: {
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || ':memory:',
    logging: false,
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.PGSSL === '0' ? false : { require: true, rejectUnauthorized: false },
    },
  },
};
