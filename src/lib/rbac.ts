export type Role = "ADMIN" | "ATTORNEY" | "INTAKE" | "PARALEGAL" | "VIEWER";

export function canEdit(role: Role): boolean {
  return ["ADMIN", "ATTORNEY", "INTAKE", "PARALEGAL"].includes(role);
}

export function canDelete(role: Role): boolean {
  return ["ADMIN"].includes(role);
}



