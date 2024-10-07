import { ConfirmationModalParameters } from "../../types";

export default function ConfirmationModal({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: ConfirmationModalParameters) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-900 bg-opacity-75">
      <div className="bg-white p-8 md:p-12 rounded-lg shadow-xl w-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Confirmation</h2>
          <button
            className="text-gray-600 hover:text-gray-800 focus:outline-none"
            onClick={onCancel}
            type="button"
            title="Close Modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <hr className="mb-4 border-gray-200 w-full" />
        <p className="text-gray-700 mb-6">{message}</p>
        <div className="flex justify-between">
          <button
            type="button"
            className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg mr-2"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="bg-black hover:bg-gray-900 text-white font-semibold py-2 px-4 rounded-lg"
            onClick={onConfirm}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
