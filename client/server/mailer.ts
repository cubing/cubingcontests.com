import "server-only";
import { MailtrapClient } from "mailtrap";
import { loadEnvConfig } from "@next/env";

// This is needed when running Better Auth DB migrations
if (process.env.NODE_ENV !== "production") loadEnvConfig(".", true);

const client = new MailtrapClient({
  token: process.env.EMAIL_TOKEN!,
  testInboxId: process.env.NODE_ENV === "production" ? undefined : 2655545,
  sandbox: process.env.NODE_ENV !== "production",
});

const baseUrl = process.env.BASE_URL;
const from = {
  name: "Cubing Contests",
  email: `no-reply@${process.env.PROD_BASE_URL!.split("://").at(1)}`,
};

function getHtml(contents: string) {
  return `
    <!doctype html>
    <html>
      <head>
        <title>Cubing Contests</title>
        <style>
          body { font-family: Arial, Helvetica, sans-serif; }
        </style>
      </head>
      <body>
        ${contents}
      </body>
    </html>
`;
}

export async function sendEmail(to: string, subject: string, content: string) {
  try {
    await client.send({
      from,
      to: [{ email: to }],
      subject,
      html: getHtml(content),
    });
  } catch (err) {
    console.error(err);
  }
}

export async function sendResetPasswordEmail(to: string, url: string) {
  try {
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
  } catch (err) {
    console.error(err);
  }
}

export async function sendVerificationCodeEmail(to: string, url: string) {
  try {
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
  } catch (err) {
    console.error(err);
  }
}

export async function sendRoleChangedEmail(to: string, role: string) {
  try {
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
  } catch (err) {
    console.error(err);
  }
}
