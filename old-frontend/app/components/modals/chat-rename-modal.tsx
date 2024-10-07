import { useState } from "react";
import { ChatRenameModalParameters } from "../../types";
import LoadingButton from "../loading-button";

export default function ChatRenameModal(
  modalParameters: ChatRenameModalParameters
) {
  const [chat_title, setChat_title] = useState<string>("");

  function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.preventDefault();

    // Call the onSubmitted callback with the chat_id and chat_title
    modalParameters
      .onSubmitted(modalParameters.chat_id, chat_title)
      .then(() => {
        // Close the modal
        modalParameters.closeModal();
      });

    return Promise.resolve(); // This is needed to satisfy the type checker TODO: Fix this
  }

  const handleCancelClose = () => {
    // Call the onClose callback to close the modal
    modalParameters.closeModal();
  };

  if (!modalParameters.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white text-black p-6 rounded-lg shadow-lg w-1/2">
        <h2 className="font-bold mb-4 text-3xl">Rename Chat</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="chatTitle"
            >
              Enter New Chat Name
            </label>
            <input
              id="chatTitle"
              type="text"
              value={chat_title}
              onChange={(event) => setChat_title(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              required
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleCancelClose}
              className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg mr-2"
            >
              Cancel
            </button>
            <LoadingButton
              handleClick={handleSubmit}
              type="submit"
              text="Rename Chat"
              loadingText="Renaming Chat..."
              disabled={!chat_title}
              className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
