import Link from 'next/link';

const ThankYouPage = () => {
  return (
    <div className="px-3">
      <h1 className="mb-4 text-center">Thank You!</h1>

      <p className="mx-auto" style={{ maxWidth: '600px' }}>
        Seriously, thank you for your generosity! You help us continue the development and maintenance of Cubing
        Contests, and you are an invaluable member of the cubing community :)
      </p>

      <div className="d-flex justify-content-center mt-5">
        <Link href="/" className="btn btn-primary">
          Back to Homepage
        </Link>
      </div>
    </div>
  );
};

export default ThankYouPage;
