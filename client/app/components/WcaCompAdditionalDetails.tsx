const WcaCompAdditionalDetails = (
  { name, competitionId }: { name: string; competitionId: string },
) => {
  return (
    <p className="mb-4">
      Unofficial events from {name}. For official events see the official{" "}
      <a
        href={`https://worldcubeassociation.org/competitions/${competitionId}`}
      >
        WCA competition page
      </a>.
    </p>
  );
};

export default WcaCompAdditionalDetails;
