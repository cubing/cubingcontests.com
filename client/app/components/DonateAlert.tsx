import Link from "next/link";

const DonateAlert = () => {
  return (
    <div className="alert alert-light mx-3 mb-4" role="alert">
      <Link href="/donate" target="_blank">Keep the lights on!</Link>{" "}
      Cubing Contests is supported by our generous donors.
    </div>
  );
};

export default DonateAlert;
