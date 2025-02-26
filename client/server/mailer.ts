import "server-only";
import { MailtrapClient } from "mailtrap";

const client = process.env.NODE_ENV === "production"
  ? new MailtrapClient({
    token: process.env.EMAIL_TOKEN!,
  })
  : new MailtrapClient({
    token: process.env.EMAIL_TOKEN!,
    accountId: 1854211,
    testInboxId: 2655545,
  }).testing;

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

export async function sendResetPassword(to: string, url: string) {
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

export async function sendVerificationCode(to: string, url: string) {
  try {
    await client.send({
      from,
      to: [{ email: to }],
      subject: "Email verification",
      html: getHtml(`
        <h1>Email Verification</h1>
        <p>
          Thank you for signing up to
          <a href="${process.env.BASE_URL}">Cubing Contests</a>. Click the link below to verify your email:
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
