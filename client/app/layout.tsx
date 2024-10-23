import "bootstrap/dist/css/bootstrap.css";
import "~/app/globals.css";
import MainLayout from "~/app/components/UI/MainLayout.tsx";

// SEO
export const metadata = {
  title: "Cubing Contests",
  description: "The best place for hosting unofficial Rubik's Cube competitions and speedcuber meetups.",
  keywords:
    "rubik's rubiks cube contest contests competition competitions meetup meetups speedcubing speed cubing puzzle",
  icons: { icon: "/favicon.png" },
  metadataBase: new URL("https://cubingcontests.com"),
  openGraph: {
    images: ["/api2/static/cubing_contests_1.jpg"],
  },
};

export default function RootLayout(
  { children }: { children: React.ReactNode },
) {
  return (
    <html lang="en">
      <MainLayout>{children}</MainLayout>
    </html>
  );
}
