/**
 * Application roles. The string values are exactly what docs/development-docs.md
 * §2 refers to ("super_admin" / "admin") and are what gets embedded in the JWT.
 */
export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
}
