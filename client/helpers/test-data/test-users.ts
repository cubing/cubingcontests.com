const password = "Temporary_good_password123"; // replaced with "rr" in the instrumentation file

export const testUsers = [
  {
    email: "admin@example.com",
    username: "admin",
    name: "admin",
    password,
    role: "admin",
    emailVerified: true,
    member: {
      role: "admin,member",
      personId: 1,
    },
  },
  {
    email: "mod@example.com",
    username: "mod",
    name: "mod",
    password,
    role: "user",
    emailVerified: true,
    member: {
      role: "mod,member",
      personId: 2,
    },
  },
  {
    email: "user@example.com",
    username: "user",
    name: "user",
    password,
    emailVerified: true,
    member: {
      role: "member",
      personId: 3,
    },
  },
  {
    email: "new_user@example.com",
    username: "new_user",
    name: "new_user",
    password,
    emailVerified: false,
    member: {
      role: "member",
      personId: 4,
    },
  },
];
