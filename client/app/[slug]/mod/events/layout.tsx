import ToastMessages from "~/app/components/UI/ToastMessages.tsx";

type Props = {
  children: React.ReactNode;
};

function EventsLayout({ children }: Props) {
  return (
    <section>
      <h2 className="mb-4 text-center">Events</h2>

      <ToastMessages className="mx-2" />

      {children}
    </section>
  );
}

export default EventsLayout;