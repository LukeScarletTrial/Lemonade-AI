import React, { useEffect, useState } from 'react';
import { Globe, RotateCw, Maximize2, Minimize2 } from 'lucide-react';
import { FileSystemItem } from '../types';

interface PreviewProps {
  files: FileSystemItem[];
  refreshTrigger: number;
  onRefresh: () => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

const Preview: React.FC<PreviewProps> = ({ 
  files, 
  refreshTrigger, 
  onRefresh,
  isFullScreen,
  onToggleFullScreen
}) => {
  const [srcDoc, setSrcDoc] = useState('');

  useEffect(() => {
    // Basic bundler simulation
    const indexHtml = (files.find(f => f.name === 'index.html' && f.type === 'file') as any)?.content || '<h1>No index.html found</h1>';
    const styles = files.filter(f => f.type === 'file' && f.name.endsWith('.css')).map(f => (f as any).content).join('\n');
    const scripts = files.filter(f => f.type === 'file' && f.name.endsWith('.js')).map(f => (f as any).content).join('\n');

    // Inject CSS
    let fullHtml = indexHtml.replace('</head>', `<style>${styles}</style></head>`);
    
    // Inject JS (at the end of body to ensure DOM load)
    // We wrap in try-catch to prevent iframe crash affecting parent
    const safeScript = `
      <script>
        try {
          ${scripts}
        } catch (e) {
          console.error("Runtime Error:", e);
          document.body.innerHTML += '<div style="color:red; background:#fee; padding:10px; border-top:1px solid red; position:fixed; bottom:0; width:100%">' + e.message + '</div>';
        }
      </script>
    `;
    fullHtml = fullHtml.replace('</body>', `${safeScript}</body>`);

    setSrcDoc(fullHtml);
  }, [files, refreshTrigger]);

  return (
    <div className={`h-full w-full bg-white flex flex-col ${isFullScreen ? 'shadow-2xl' : ''}`}>
      {/* Browser Bar */}
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center text-xs text-gray-600 h-9 shrink-0">
        <div className="flex items-center gap-3 flex-1">
           {/* Window Controls Decoration */}
           <div className="flex gap-1.5 group">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 group-hover:bg-red-500 transition-colors"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 group-hover:bg-yellow-500 transition-colors"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 group-hover:bg-green-500 transition-colors"></div>
           </div>
           
           {/* Address Bar */}
           <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-md border border-gray-200 flex-1 max-w-md mx-2">
             <Globe size={10} className="opacity-50" /> 
             <span className="opacity-70">localhost:3000</span>
           </div>

           {/* Refresh Button */}
           <button 
             onClick={onRefresh}
             className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
             title="Refresh Preview"
           >
             <RotateCw size={12} />
           </button>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2">
           <button 
             onClick={onToggleFullScreen}
             className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
             title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
           >
             {isFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
           </button>
        </div>
      </div>
      
      <iframe
        title="Preview"
        srcDoc={srcDoc}
        className="flex-1 w-full border-none bg-white"
        sandbox="allow-scripts allow-modals"
      />
    </div>
  );
};

export default Preview;