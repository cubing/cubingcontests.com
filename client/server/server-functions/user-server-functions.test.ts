import { beforeEach, describe, expect, it } from "vitest";
import { db } from "~/server/db/provider.ts";
import type { OrganizationRole } from "~/server/organization-permissions.ts";
import { updateMemberSF } from "~/server/server-functions/user-server-functions.ts";
import { reseedTestData } from "~/vitest-setup.ts";

describe("updateMemberSF", () => {
  beforeEach(reseedTestData);

  it("updates member's person ID", async () => {
    const notYetTakenPersonId = 5;
    const member = (await db.query.members.findFirst({ with: { user: true }, where: { user: { username: "user" } } }))!;
    expect(member.personId).toBe(3);

    const res = await updateMemberSF({
      id: member.id,
      personId: notYetTakenPersonId,
      roles: member.role!.split(",") as OrganizationRole[],
    });

    expect(res.serverError).toBeUndefined();
    expect(res.validationErrors).toBeUndefined();
    expect(res.data!.person!.id).toBe(notYetTakenPersonId);
  });

  it("updates member's role to mod", async () => {
    const roles: OrganizationRole[] = ["mod", "member"];
    const member = (await db.query.members.findFirst({ with: { user: true }, where: { user: { username: "user" } } }))!;

    const res = await updateMemberSF({ id: member.id, personId: member.personId, roles });

    expect(res.serverError).toBeUndefined();
    expect(res.validationErrors).toBeUndefined();
    expect(res.data!.member.role).toBe(roles.join(","));
  });

  it("updates member's role to admin", async () => {
    const roles: OrganizationRole[] = ["admin", "member"];
    const member = (await db.query.members.findFirst({ with: { user: true }, where: { user: { username: "user" } } }))!;

    const res = await updateMemberSF({ id: member.id, personId: member.personId, roles });

    expect(res.serverError).toBeUndefined();
    expect(res.validationErrors).toBeUndefined();
    expect(res.data!.member.role).toBe(roles.join(","));
  });

  describe("server errors", async () => {
    it("throws error for member not found", async () => {
      const res = await updateMemberSF({ id: "INVALID", personId: 1, roles: ["member"] });

      expect(res.validationErrors).toBeUndefined();
      expect(res.serverError?.message).toBe("Member not found");
    });

    it("throws error for person ID not found", async () => {
      const member = (await db.query.members.findFirst({
        with: { user: true },
        where: { user: { username: "user" } },
      }))!;
      const res = await updateMemberSF({
        id: member.id,
        personId: 999999999,
        roles: member.role!.split(",") as OrganizationRole[],
      });

      expect(res.validationErrors).toBeUndefined();
      expect(res.serverError?.message).toBe("Person with ID 999999999 not found");
    });

    it("throws error for missing person ID for privileged member", async () => {
      const member = (await db.query.members.findFirst({
        with: { user: true },
        where: { user: { username: "user" } },
      }))!;
      const res = await updateMemberSF({ id: member.id, roles: ["member", "mod"] });

      expect(res.validationErrors).toBeUndefined();
      expect(res.serverError?.message).toBe("Privileged members must have a person tied to their profile");
    });
  });
});
