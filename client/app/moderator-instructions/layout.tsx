import Link from "next/link";
import "./moderator-instructions.css";
import { C } from "~/helpers/constants.ts";

const ModeratorInstructions = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="px-3 pb-4">
      <h3 className="mb-4 text-center">How to hold a contest</h3>

      <div className="mb-4">
        <p>
          If you don't already have moderator privileges and you would like to hold unofficial events at a WCA
          competition (A) or create an unofficial competition (B) or meetup (C), follow these steps:
        </p>
        <div style={{ height: "1rem" }} />
        <p>
          1. <Link href="/register">Create an account</Link> and send an email to {C.contactEmail}{" "}
          with the following information (exception: for WCA competitions,{" "}
          <b>you must first wait until the competition has been announced</b> on the WCA website):
        </p>
        <p>1.1. Username</p>
        <p>1.2. WCA ID</p>
        <p>1.3. Name of the competition/meetup you are organizing</p>
        <p>
          2. Once an admin grants you moderator privileges and ties your competitor profile to your account, log out and
          log back in. You will now be able to find the "Mod Dashboard" button in the user section in the navbar. Go to
          that page.
        </p>
      </div>

      {children}
    </div>
  );
};

export default ModeratorInstructions;
