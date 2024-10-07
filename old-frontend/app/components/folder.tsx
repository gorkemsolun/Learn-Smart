import { useDrag, useDrop } from "react-dnd";
import { FolderParameters, FolderType } from "../types";

export default function Folder({
  folder,
  onDrop,
  toggleFolder,
  isOpen,
}: FolderParameters) {
  const [{ isOver }, drop] = useDrop({
    accept: "folder",
    drop: (item: FolderType) => onDrop(item, folder),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  const [{ isDragging }, drag] = useDrag({
    type: "folder",
    item: folder,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  return (
    <div
      // ref={drag}
      className={`bg-gray-700 p-4 rounded-lg text-center ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div
        // ref={drop}
        className={`folder-drop-area ${isOver ? "bg-gray-600" : ""}`}
      >
        <button
          onClick={() => toggleFolder(folder.name)}
          className="flex flex-col items-center"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
            />
          </svg>
          <div className="folder-name mt-2">{folder.name}</div>
        </button>
        {isOpen && folder.folders.length > 0 && (
          <div className="subfolders mt-2">
            {folder.folders.map((subFolder, index) => (
              <Folder
                key={index}
                folder={subFolder}
                onDrop={onDrop}
                toggleFolder={toggleFolder}
                isOpen={isOpen}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
