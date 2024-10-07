import Folder from "@/app/components/folder";
import { useState } from "react";
import { FolderListParameters } from "../types";

export default function FolderList({
  folders,
  handleDrop,
}: FolderListParameters) {
  const [openFolders, setOpenFolders] = useState<string[]>([]);

  const toggleFolder = (folderName: string) => {
    setOpenFolders((prevOpenFolders) =>
      prevOpenFolders.includes(folderName)
        ? prevOpenFolders.filter((name) => name !== folderName)
        : [...prevOpenFolders, folderName]
    );
  };

  return (
    <div className="folder-list grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {folders.map((folder, index) => (
        <Folder
          key={index}
          folder={folder}
          onDrop={handleDrop}
          toggleFolder={toggleFolder}
          isOpen={openFolders.includes(folder.name)}
        />
      ))}
    </div>
  );
}
