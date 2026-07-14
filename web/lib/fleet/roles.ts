/** Shared fleet portal role check — keep middleware + page guards aligned. */
export function isFleetPortalUser(role: string | undefined | null): boolean {
  const r = String(role || '').toUpperCase();
  return r === 'FLEET_OPERATOR' || r === 'FLEET' || r === 'ADMIN';
}
