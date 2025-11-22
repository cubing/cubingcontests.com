import "server-only";
import { loadEnvConfig } from "@next/env";
import { MailtrapClient } from "mailtrap";

// This is needed when running Better Auth DB migrations
if (process.env.NODE_ENV !== "production") loadEnvConfig(".", true);

const client = new MailtrapClient({
  token: process.env.EMAIL_TOKEN!,
  testInboxId: process.env.NODE_ENV === "production" ? undefined : Number(process.env.EMAIL_TEST_INBOX_ID),
  sandbox: process.env.NODE_ENV !== "production",
});

const baseUrl = process.env.BASE_URL;
const from = {
  name: "Cubing Contests",
  email: `no-reply@${process.env.PROD_BASE_URL!.split("://").at(1)}`,
};

function getHtml(contents: string) {
  return contents;

  //   return `
  //     <!doctype html>
  //     <html>
  //       <head>
  //         <title>Cubing Contests</title>
  //         <style>
  //           body { font-family: Arial, Helvetica, sans-serif; }
  //         </style>
  //       </head>
  //       <body>
  //         ${contents}
  //       </body>
  //     </html>
  // `;
}

async function send(func: () => Promise<void>) {
  if (!process.env.EMAIL_TOKEN) {
    if (process.env.NODE_ENV !== "production")
      console.log("Not sending email, because EMAIL_TOKEN environment variable isn't set");
    return;
  }

  try {
    await func();
  } catch (err) {
    console.error("Error while sending email:", err);
  }
}

export async function sendEmail(to: string, subject: string, content: string) {
  await send(async () => {
    await client.send({
      from,
      to: [{ email: to }],
      subject,
      html: getHtml(content),
    });
  });
}

export async function sendResetPasswordEmail(to: string, url: string) {
  await send(async () => {
    await client.send({
      from,
      to: [{ email: to }],
      subject: "Password reset",
      html: getHtml(`
        <h1>Password Reset</h1>
        <p>
          Someone requested a password reset on <a href="${process.env.BASE_URL}">Cubing Contests</a>
          using your email address. Click the link below to reset your password:
        </p>
        <a href="${url}">Reset password</a>
        <p>
          If you didn't make this password reset request, you can safely ignore this email. All this means is that someone
          either knows your email address or entered it by accident.
        </p>
      `),
    });
  });
}

export async function sendVerificationCodeEmail(to: string, url: string) {
  await send(async () => {
    await client.send({
      from,
      to: [{ email: to }],
      subject: "Email verification",
      html: getHtml(`
        <h1>Email Verification</h1>
        <p>
          Thank you for signing up to
          <a href="${baseUrl}">Cubing Contests</a>. Click the link below to verify your email:
        </p>
        <a href="${url}" style="font-weight: bold">Verify email</a>
        <p>
          If you didn't create an account on Cubing Contests, you can safely ignore this email. All this means is that
          someone either knows your email address or entered it by accident.
        </p>
      `),
    });
  });
}

export async function sendRoleChangedEmail(to: string, role: string) {
  await send(async () => {
    await client.send({
      from,
      to: [{ email: to }],
      subject: "Role changed",
      html: getHtml(`
        <h3>Role changed</h3>
        <p>
          You have been given the ${role} role on
          <a href="${baseUrl}">Cubing Contests</a>.${
            role !== "user"
              ? ` You can now access the <a href="${baseUrl}/mod">Moderator Dashboard</a> from the navigation bar.`
              : ""
          }
        </p>
      `),
    });
  });
}
