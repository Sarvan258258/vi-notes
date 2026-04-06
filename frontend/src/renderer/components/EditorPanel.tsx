import React from "react";
import type { ClipboardEventHandler, KeyboardEventHandler } from "react";

type EditorPanelProps = {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: KeyboardEventHandler<HTMLTextAreaElement>;
  onKeyUp: KeyboardEventHandler<HTMLTextAreaElement>;
  onPaste: ClipboardEventHandler<HTMLTextAreaElement>;
};

const EditorPanel = ({ value, onChange, onKeyDown, onKeyUp, onPaste }: EditorPanelProps) => (
  <textarea
    className="editor"
    placeholder="Start writing here..."
    value={value}
    onChange={(event) => onChange(event.target.value)}
    onKeyDown={onKeyDown}
    onKeyUp={onKeyUp}
    onPaste={onPaste}
    spellCheck={true}
  />
);

export default EditorPanel;
