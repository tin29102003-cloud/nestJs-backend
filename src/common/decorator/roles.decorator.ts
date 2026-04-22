import { SetMetadata } from "@nestjs/common";

export const RILES_KEY = 'roles';
export const Roles = (...roles: (number | string)[]) => SetMetadata(RILES_KEY, roles);  