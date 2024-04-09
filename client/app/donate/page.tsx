import C from '@sh/constants';

const DonatePage = () => {
  return (
    <div className="px-3">
      <h1 className="mb-4 text-center">Donate</h1>
      <p>
        If you would like to support the development and maintenance of Cubing Contests, you can use one of the donation
        methods below. You will be directly supporting Deni Mintsaev, currently the only developer and maintainer of
        Cubing Contests.
      </p>

      <h3 className="cc-basic-heading">GitHub Sponsorship</h3>
      <p>You can become a one-time or recurring sponsor of Deni Mintsaev on GitHub.</p>
      <a href="https://github.com/sponsors/dmint789" target="_blank" className="btn btn-success mt-2">
        Support on GitHub
      </a>

      <h3 className="cc-basic-heading">Monero</h3>
      <p>You can send a Monero (cryptocurrency) donation to the following address:</p>
      <p className="mt-4 p-3 border rounded-3 fw-bold">{C.moneroDonationAddress}</p>
    </div>
  );
};

export default DonatePage;
