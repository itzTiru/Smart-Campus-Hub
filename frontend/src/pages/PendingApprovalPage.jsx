const PendingApprovalPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
          <span className="text-xl">⌛</span>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          Approval Pending
        </h1>

        <p className="text-sm text-gray-600">
          Your account was created successfully, but your access is waiting for admin approval.
        </p>

        <p className="mt-3 text-xs text-gray-400">
          Please contact an administrator if approval takes longer than expected.
        </p>
      </div>
    </div>
  );
};

export default PendingApprovalPage;
