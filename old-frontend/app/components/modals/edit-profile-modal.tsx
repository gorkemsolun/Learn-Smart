import { useEffect, useState } from "react";
import { EditProfileModalParameters } from "../../types";
import LoadingButton from "../loading-button";

export default function EditProfileModal(
  modalParameters: EditProfileModalParameters
) {
  const [name, setName] = useState<string>(modalParameters.user.name);
  const [nickname, setNickname] = useState<string>(
    modalParameters.user.nickname
  );
  const [email, setEmail] = useState<string>(modalParameters.user.email);
  const [password, setPassword] = useState<string>(
    modalParameters.user.password
  );

  useEffect(() => {
    setName(modalParameters.user.name);
    setNickname(modalParameters.user.nickname);
    setEmail(modalParameters.user.email);
    setPassword(modalParameters.user.password);
  }, [modalParameters.user]);

  function handleSubmit(
    event:
      | React.FormEvent<HTMLFormElement>
      | React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) {
    event.preventDefault();

    // Call the onSubmitted callback with the chat_id and chat_title
    modalParameters
      .onSubmitted(
        modalParameters.user.user_id,
        name,
        nickname,
        email,
        password
      )
      .then(() => {
        // Close the modal
        modalParameters.onClose();
      });

    return Promise.resolve(); // This is needed to satisfy the type checker TODO: Fix this
  }

  const handleCancelClose = () => {
    // Call the onClose callback to close the modal
    modalParameters.onClose();
  };

  if (!modalParameters.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white text-black p-6 rounded-lg shadow-lg w-1/2">
        <h2 className="font-bold mb-4 text-3xl">Edit Profile</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Enter New Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="nickname"
            >
              Enter New Nickname
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1" htmlFor="email">
              Enter New Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              required
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="password"
            >
              Enter New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
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
              text="Submit"
              loadingText="Editing Profile..."
              disabled={!name || !nickname || !email}
              className="bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg"
            />
          </div>
        </form>
      </div>
    </div>
  );
}
