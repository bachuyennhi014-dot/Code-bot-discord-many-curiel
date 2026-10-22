import { PermissionLevel } from '../types/cultivation.js';
import { db } from '../database/database.js';

export const ABSOLUTE_OWNER_ID = '1402913586853974156';
export const DEFAULT_QUAN_LY_ID = '1497539163157954560';

export function getOwnerId(): string {
  return process.env.OWNER_ID || ABSOLUTE_OWNER_ID;
}

export function isOwner(userId: string): boolean {
  return userId === getOwnerId();
}

export function isQuanLy(userId: string): boolean {
  if (isOwner(userId)) return true;
  if (userId === DEFAULT_QUAN_LY_ID) return true;
  return db.getQuanLy(userId) !== null;
}

export function isStaff(userId: string): boolean {
  if (isOwner(userId)) return true;
  if (isQuanLy(userId)) return true;
  return db.getStaff(userId) !== null;
}

export function hasPermission(userId: string, required: PermissionLevel): boolean {
  switch (required) {
    case 'OWNER':
      return isOwner(userId);
    case 'QUAN_LY':
      return isOwner(userId) || isQuanLy(userId);
    case 'STAFF':
      return isOwner(userId) || isQuanLy(userId) || isStaff(userId);
    case 'PLAYER':
      return true;
    default:
      return false;
  }
}
