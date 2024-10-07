import Markdown from "react-markdown";
import { MarkdownContentParameters } from "../types";

export default function MarkdownContent({
  markdown_content,
}: MarkdownContentParameters) {
  return <Markdown>{markdown_content}</Markdown>;
}
