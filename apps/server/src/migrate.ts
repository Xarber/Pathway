import {database,migrate} from './db.js';
const db=await database(process.env.DATABASE_URL||process.env.SQLITE_PATH);await migrate(db);await db.close();console.log('Schema is up to date');
