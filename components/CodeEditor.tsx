import React from 'react';
import { FileSystemItem } from '../types';

interface CodeEditorProps {
  activeFile: FileSystemItem | null;
  onContentChange: (newContent: string) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ activeFile, onContentChange }) => {
  if (!activeFile || activeFile.type !== 'file') {
    return (
      <div className="h-full flex items-center justify-center text-ide-text opacity-50 bg-ide-bg">
        <div className="text-center">
          <p className="mb-2 text-4xl">🍋</p>
          <p>Select a file to edit</p>
          <p className="text-xs mt-4">Cmd+S to save (autosaved in memory)</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative bg-ide-bg font-mono text-sm">
      <textarea
        className="w-full h-full p-4 bg-transparent text-ide-textMain resize-none outline-none z-10 relative leading-6"
        value={activeFile.content}
        onChange={(e) => onContentChange(e.target.value)}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        style={{ tabSize: 2 }}
      />
    </div>
  );
};

export default CodeEditor;