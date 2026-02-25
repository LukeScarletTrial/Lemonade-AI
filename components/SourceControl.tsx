import React, { useState } from 'react';
import { GitBranch, GitCommit, Clock, RotateCcw, Save } from 'lucide-react';
import { Commit } from '../types';

interface SourceControlProps {
  commits: Commit[];
  onCommit: (message: string) => void;
  onRestore: (commit: Commit) => void;
}

const SourceControl: React.FC<SourceControlProps> = ({ commits, onCommit, onRestore }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onCommit(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="h-full flex flex-col bg-ide-sidebar border-r border-ide-border">
      <div className="h-9 px-3 text-xs font-bold uppercase tracking-wider text-ide-text flex items-center bg-ide-sidebar border-b border-ide-border">
        <GitBranch size={14} className="mr-2" /> Source Control
      </div>

      <div className="p-3 border-b border-ide-border">
        <form onSubmit={handleSubmit}>
            <input 
                type="text" 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Commit message..."
                className="w-full bg-ide-activity border border-ide-border rounded p-2 text-xs text-white mb-2 focus:border-ide-accent outline-none"
            />
            <button 
                type="submit"
                disabled={!message.trim()}
                className="w-full bg-ide-accent hover:bg-blue-600 text-white text-xs py-1.5 rounded flex items-center justify-center gap-2 disabled:opacity-50"
            >
                <GitCommit size={12} /> Commit Changes
            </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] text-ide-text opacity-50 uppercase font-bold">History</div>
        {commits.length === 0 && (
            <div className="text-center text-xs text-ide-text opacity-40 mt-4">
                No commits yet.
            </div>
        )}
        {[...commits].reverse().map(commit => (
            <div key={commit.id} className="px-3 py-3 border-b border-ide-border/50 hover:bg-ide-hover group">
                <div className="flex items-start justify-between mb-1">
                    <span className="text-xs text-white font-medium">{commit.message}</span>
                    <button 
                        onClick={() => onRestore(commit)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-ide-activity rounded text-yellow-400"
                        title="Restore this version"
                    >
                        <RotateCcw size={12} />
                    </button>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-ide-text opacity-60">
                    <Clock size={10} />
                    <span>{new Date(commit.timestamp).toLocaleString()}</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default SourceControl;