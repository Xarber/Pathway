// SPDX-License-Identifier: AGPL-3.0-only
import {database} from './db.js';
import {createApp} from './app.js';
if(process.env.NODE_ENV==='production'&&!process.env.DATABASE_URL)throw new Error('Production requires DATABASE_URL (PostgreSQL/PostGIS)');
const {app}=await createApp({db:await database(process.env.DATABASE_URL||process.env.SQLITE_PATH),production:process.env.NODE_ENV==='production',origins:process.env.CORS_ORIGINS?.split(',')});
await app.listen({port:Number(process.env.PORT||3001),host:process.env.HOST||'127.0.0.1'});
console.log('Pathway API listening. Request bodies and location data are not logged.');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{void app.close().then(()=>process.exit(0));});
