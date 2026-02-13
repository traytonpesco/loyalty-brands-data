import { Sequelize } from 'sequelize';

const databaseUrl = process.env.DATABASE_URL as string | undefined;
const usePostgres = Boolean(databaseUrl);

let sequelize: Sequelize;
if (usePostgres) {
  sequelize = new Sequelize(databaseUrl!, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.PGSSL === '0' ? false : { require: true, rejectUnauthorized: false },
    },
  });
} else {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.SQLITE_STORAGE || './var/dev.sqlite',
    logging: false,
  });
}

export default sequelize;
