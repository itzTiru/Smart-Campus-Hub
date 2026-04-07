import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-blue-600">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">Page Not Found</h2>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mt-6 inline-block">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
