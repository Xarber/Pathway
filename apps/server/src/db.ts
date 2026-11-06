// SPDX-License-Identifier: AGPL-3.0-only
import {DatabaseSync} from 'node:sqlite';
import pg from 'pg';
import {readFile} from 'node:fs/promises';
export interface Database {all<T=Record<string,any>>(sql:string,params?:any[]):Promise<T[]>;run(sql:string,params?:any[]):Promise<void>;close():Promise<void>;dialect:'sqlite'|'postgres'}
export async function database(url?:string):Promise<Database>{
 if(url?.startsWith('postgres')){const client=new pg.Client({connectionString:url});await client.connect();return {dialect:'postgres',all:async(sql,p=[]) =>{let n=0;return (await client.query(sql.replace(/\?/g,()=>'$'+(++n)),p)).rows;},run:async(sql,p=[])=>{let n=0;await client.query(sql.replace(/\?/g,()=>'$'+(++n)),p);},close:async()=>{await client.end();}};}
 const db=new DatabaseSync(url||'pathway.sqlite');db.exec('PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;');return {dialect:'sqlite',all:async(sql,p=[])=>db.prepare(sql).all(...p) as any,run:async(sql,p=[])=>{db.prepare(sql).run(...p);},close:async()=>{db.close();}};
}

export async function migrate(db:Database){const schema=await readFile(new URL('../../../infra/schema.sql',import.meta.url),'utf8');for(const statement of schema.split(';').map(s=>s.trim()).filter(Boolean))await db.run(statement);if(db.dialect==='postgres'){await db.run('CREATE EXTENSION IF NOT EXISTS postgis');await db.run('ALTER TABLE live_locations ADD COLUMN IF NOT EXISTS point geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude),4326)::geography) STORED');await db.run('CREATE INDEX IF NOT EXISTS live_point_idx ON live_locations USING GIST(point)');}}
export class Serial {private tail:Promise<unknown>=Promise.resolve();async use<T>(fn:()=>Promise<T>):Promise<T>{const next=this.tail.then(fn,fn);this.tail=next.catch(()=>{});return next;}}
