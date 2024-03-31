import C from '@sh/constants';

const DonatePage = () => {
  return (
    <div className="px-3">
      <h1 className="mb-4 text-center">Donate</h1>
      <p>
        If you would like to support the development and maintenance of Cubing Contests, you can use one of the
        following donation methods:
      </p>
      <h3>Monero</h3>
      <p>You can send a Monero (cryptocurrency) donation to the following address:</p>
      <p className="fw-bold">{C.moneroDonationAddress}</p>
    </div>
  );
};

export default DonatePage;
