import React from 'react';

interface TerminalProps {
  logs: string[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  return (
    <div className="h-full w-full bg-black text-green-400 font-mono text-xs p-2 overflow-y-auto">
      <div className="mb-2 opacity-50">Lemonade Terminal v1.0.0</div>
      {logs.map((log, i) => (
        <div key={i} className="whitespace-pre-wrap mb-1 font-mono">
            <span className="text-blue-500 mr-2">$</span>
            {log}
        </div>
      ))}
      <div className="animate-pulse">_</div>
    </div>
  );
};

export default Terminal;