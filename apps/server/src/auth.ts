// SPDX-License-Identifier: AGPL-3.0-only
import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import {promisify} from 'node:util';
const scrypt=promisify(derive);
export const token=()=>randomBytes(32).toString('base64url');
export const hash=(value:string)=>createHash('sha256').update(value).digest('hex');
export async function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+(await scrypt(password,salt,64) as Buffer).toString('hex');}
export async function passwordMatches(password:string,stored:string){const [salt,expected]=stored.split(':');const actual=await scrypt(password,salt,64) as Buffer;return timingSafeEqual(actual,Buffer.from(expected,'hex'));}
