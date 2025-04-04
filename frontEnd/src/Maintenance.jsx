import React from 'react';

const Maintenance = () => {
  return (
    <div
      className="-z-20 min-h-dvh"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' width='20' height='20' fill='none' strokeWidth='2' stroke='%23E0E0E0'%3e%3cpath d='M0 .5H19.5V20'/%3e%3c/svg%3e")`,
      }}
    >
      <div className="flex min-h-screen flex-col items-center justify-center bg-green-50/60 p-4 text-gray-800">
        <div className="w-full max-w-md overflow-hidden rounded-lg border-3 border-green-400 bg-white shadow-2xl">
          <div className="p-6 text-center">
            <h1 className="mb-4 text-3xl font-bold text-green-600">
              Site Under Maintenance
            </h1>

            <div className="my-8 flex justify-center">
              <div className="relative">
                {/* Mining animation */}
                <div className="mx-auto mb-4 h-32 w-32">
                  <div className="absolute animate-bounce">
                    <svg
                      className="h-10 w-10 text-green-500"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <svg
                    className="h-32 w-32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M2 9H22V20H2V9Z" fill="#E5E7EB" />
                    <path d="M11 4H13V9H11V4Z" fill="#D1D5DB" />
                    <path d="M7 12H9V16H7V12Z" fill="#9CA3AF" />
                    <path d="M11 12H13V16H11V12Z" fill="#9CA3AF" />
                    <path d="M15 12H17V16H15V12Z" fill="#9CA3AF" />
                    <path d="M4 20H20V22H4V20Z" fill="#6B7280" />
                    <path d="M2 9H22V11H2V9Z" fill="#F3F4F6" />
                  </svg>
                </div>
              </div>
            </div>

            <p className="mb-4 text-lg">
              We're currently working on improvements!
            </p>

            <p className="mb-6 text-gray-500">
              We&apos;re working hard to enhance experiences. We&apos;ll be back
              online shortly with new features and improvements.
            </p>

            <div className="mt-8 flex justify-center space-x-6">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-6 w-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                </div>
                <p className="text-sm text-gray-500">
                  Upgrading{' '}
                  <span className="font-medium text-gray-800">Nit TV</span>
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-green-100 bg-green-50 p-4">
            <p className="text-center text-sm text-green-600">
              Thank you for your patience! Check back soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
