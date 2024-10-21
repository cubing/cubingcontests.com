import C from '~/shared_helpers/constants.ts';

const DonatePage = () => {
  return (
    <div className='px-3'>
      <h1 className='mb-4 text-center'>Donate</h1>
      <p>
        If you would like to support the development and maintenance of Cubing Contests, you can use one of the donation
        methods below. You will be directly supporting Deni Mintsaev, currently the only developer and maintainer of
        Cubing Contests.
      </p>

      <h3 className='cc-basic-heading'>PayPal Donations</h3>
      <p>
        You can make a single donation or make donations monthly or annually on PayPal.
      </p>
      <a
        href='https://www.paypal.com/donate/?hosted_button_id=L5CZ35VXKU7VA'
        target='_blank'
        className='btn btn-primary mt-2'
      >
        Donate
      </a>

      <h3 className='cc-basic-heading'>GitHub Sponsorship</h3>
      <p>
        You can become a one-time or recurring sponsor of Deni Mintsaev on GitHub.
      </p>
      <a
        href='https://github.com/sponsors/dmint789'
        target='_blank'
        className='btn btn-success mt-2'
      >
        Support
      </a>

      <h3 className='cc-basic-heading'>Monero</h3>
      <p>
        You can send a Monero (cryptocurrency) donation to the following XMR wallet:
      </p>
      <p className='mt-4 p-3 border rounded-3 fw-bold'>
        {C.moneroDonationAddress}
      </p>
    </div>
  );
};

export default DonatePage;
