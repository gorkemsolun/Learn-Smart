import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FileUploadProps {
  text: string;
  onFileChange: (file: File | null) => void;
}

const FileUpload = ({ text, onFileChange }: FileUploadProps) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setFileName(file.name);
      onFileChange(file);
    } else {
      setFileName(null);
      onFileChange(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-2 text-sm">
          <Label htmlFor="file-upload" className="text-sm font-medium block">
            {text}
          </Label>
          {fileName && (
            <span className="text-sm text-gray-500 block">{fileName}</span>
          )}
          <Input
            id="file-upload"
            type="file"
            placeholder="File"
            accept=".pdf,.pptx"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col gap-1 p-6 items-center cursor-pointer"
          onClick={() => document.getElementById("file-upload")?.click()}
        >
          <FileIcon className="w-12 h-12" />
          <span className="text-sm font-medium text-gray-500">
            Drag and drop a file or click to browse
          </span>
          <span className="text-xs text-gray-500">PDF or PPTX</span>
        </div>
      </CardContent>
    </Card>
  );
};

function FileIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}

export default FileUpload;
