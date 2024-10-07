import { backendAPI } from "@/environment/backend_api";
import React, { useState } from "react";
import { FaCheck, FaClipboardList, FaEllipsisV, FaTimes } from "react-icons/fa";
import { QuizCardProps } from "../types";

export default function QuizCard({
  quizName,
  chatTitle,
  onClick,
  token,
  courseID,
  onQuizNameChange,
  onQuizDelete,
}: QuizCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newQuizName, setNewQuizName] = useState(quizName);
  const [currentQuizName, setRenderedQuizName] = useState(quizName);

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of the card
    setIsMenuOpen(!isMenuOpen);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of the card
    setIsRenaming(true);
    setIsMenuOpen(false);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of the card
    setIsDeleting(true); // Enter deletion mode
    setIsMenuOpen(false);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of the card

    backendAPI
      .delete(`/course/${courseID}/quizzes/${currentQuizName}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then(() => {
        setIsDeleting(false);
        if (onQuizDelete) {
          onQuizDelete(currentQuizName); // Notify parent of the deletion
        }
      })
      .catch(() => {
        alert("An error occurred while deleting quiz");
        // Optionally, handle the error (e.g., show a notification)
      });
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of the card
    setIsDeleting(false); // Exit deletion mode
  };

  const handleRenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewQuizName(e.target.value);
  };

  const handleRenameConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of the card
    backendAPI
      .put(
        `/course/${courseID}/quizzes/${currentQuizName}?new_quiz_name=${newQuizName}`,
        { new_quiz_name: newQuizName },
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      .then(() => {
        // Update frontend with new name if API call is successful
        setRenderedQuizName(newQuizName);
        setIsRenaming(false);
        if (onQuizNameChange) {
          console.log("passing " + newQuizName + "to onQuizNameChange");
          onQuizNameChange(newQuizName); // Notify parent of the name change
        }
      })
      .catch(() => {
        alert("Error renaming quiz: quiz with the same name already exists.");
      });
  };

  const handleRenameCancel = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick of the card
    setNewQuizName(currentQuizName); // Reset to the original name
    setIsRenaming(false);
  };

  return (
    <div
      onClick={onClick}
      className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center justify-center cursor-pointer relative"
    >
      {/* Ellipsis Menu */}
      <div className="absolute top-2 right-2">
        <button
          onClick={toggleMenu}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <FaEllipsisV />
        </button>
        {isMenuOpen && (
          <div
            className="absolute right-0 mt-2 w-32 bg-white border rounded-lg shadow-lg z-10"
            onClick={(e) => e.stopPropagation()} // Prevent closing modal when interacting with the menu
          >
            <button
              onClick={handleRenameClick}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Rename
            </button>
            <button
              onClick={handleDeleteClick}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="bg-black p-3 rounded-full mb-4">
        <FaClipboardList className="text-3xl text-white" />
      </div>

      <div className="text-center">
        {isRenaming ? (
          <div className="flex items-center justify-center">
            <input
              type="text"
              value={newQuizName}
              onChange={handleRenameChange}
              className="text-xl font-medium mb-2 text-black border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()} // Prevent modal open when interacting with input
            />
            <button
              onClick={handleRenameConfirm}
              className="ml-2 text-green-500 hover:text-green-700"
            >
              <FaCheck />
            </button>
            <button
              onClick={handleRenameCancel}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <FaTimes />
            </button>
          </div>
        ) : isDeleting ? (
          <div className="flex items-center justify-center">
            <p className="text-md text-red-500">Are you sure?</p>
            <button
              onClick={handleDeleteConfirm}
              className="ml-2 text-green-500 hover:text-green-700"
            >
              <FaCheck />
            </button>
            <button
              onClick={handleDeleteCancel}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <FaTimes />
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-xl font-medium mb-2 text-black">
              {currentQuizName}
            </h3>
            <p className="text-md font-light text-gray-700 mb-2">{chatTitle}</p>
          </>
        )}
      </div>
    </div>
  );
}
