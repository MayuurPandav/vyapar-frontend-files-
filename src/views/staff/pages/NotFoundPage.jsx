import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="grid min-h-screen place-items-center bg-slate-100 px-4 py-12">
    <div className="w-full max-w-xl rounded-3xl bg-white p-10 shadow-xl text-center">
      <h1 className="text-5xl font-bold text-slate-900">404</h1>
      <p className="mt-4 text-xl font-medium text-slate-700">Page not found</p>
      <p className="mt-2 text-slate-500">The route you are looking for does not exist or has been moved.</p>
      <Link to="/" className="mt-8 inline-flex rounded-3xl bg-brand-500 px-6 py-3 text-white transition hover:bg-brand-600">
        Return to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
