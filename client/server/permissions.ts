import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const modDashboard = ["view", "view-analytics"];
const competitions = ["create", "update", "approve", "delete"];
const meetups = ["create", "update", "approve", "delete"];
const persons = ["create", "update", "approve", "delete"];

const statement = {
  ...defaultStatements,
  modDashboard,
  competitions,
  meetups,
  persons,
} as const;

export const ac = createAccessControl(statement);

const permissions = {
  ...adminAc.statements,
  modDashboard,
  competitions,
  meetups,
  persons,
};

export type CcPermissions = Partial<typeof permissions>;

export const admin = ac.newRole(permissions);

export const mod = ac.newRole({
  modDashboard: ["view"],
  competitions: ["create", "update"],
  meetups: ["create", "update"],
  persons: ["create", "update", "delete"],
});
