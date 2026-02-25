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
    const isReact = files.some(f => f.name.endsWith('.jsx') || f.name.endsWith('.tsx') || (f.name === 'package.json' && f.type === 'file' && (f as any).content.includes('"react"')));

    const indexHtmlFile = files.find(f => f.name === 'index.html' && f.type === 'file');
    let indexHtml = (indexHtmlFile as any)?.content || (isReact ? '<div id="root"></div>' : '<h1>No index.html found</h1>');
    
    const styles = files.filter(f => f.type === 'file' && f.name.endsWith('.css')).map(f => (f as any).content).join('\n');
    
    // Prepare Script Content
    let scriptTags = '';

    if (isReact) {
        // 0. Cleanup: Remove existing <script> tags that point to local files (e.g. src="index.jsx")
        // because Babel standalone will try to fetch them via XHR and fail in iframe.
        indexHtml = indexHtml.replace(/<script[^>]*src=["']\.\/?[^"']+\.(js|jsx|ts|tsx)["'][^>]*><\/script>/gi, '<!-- Local script stripped by Lemonade Preview -->');
        indexHtml = indexHtml.replace(/<script[^>]*src=["']\.\/?[^"']+\.(js|jsx|ts|tsx)["'][^>]*\/>/gi, '<!-- Local script stripped by Lemonade Preview -->');

        // 1. Identify Entry Point & Files
        const entryNames = ['index.jsx', 'index.tsx', 'main.jsx', 'main.tsx', 'index.js'];
        const scriptFiles = files.filter(f => f.type === 'file' && (f.name.endsWith('.js') || f.name.endsWith('.jsx') || f.name.endsWith('.ts') || f.name.endsWith('.tsx')));
        
        // Sort: Entry point last to ensure dependencies are registered first if possible
        scriptFiles.sort((a, b) => {
            const aIsEntry = entryNames.includes(a.name);
            const bIsEntry = entryNames.includes(b.name);
            if (aIsEntry && !bIsEntry) return 1;
            if (!aIsEntry && bIsEntry) return -1;
            return 0;
        });

        // 2. Create Loader Script
        // We use document.createElement to inject transpiled code to avoid 'eval' string escaping issues.
        const loaderScript = `
          <script>
            window.process = { env: { NODE_ENV: 'development' } };
            const modules = {};
            
            // Shim for CommonJS require
            window.require = function(path) {
              if (path === 'react') return window.React;
              if (path === 'react-dom/client') return window.ReactDOM;
              if (path === 'react-dom') return window.ReactDOM;
              
              // Clean path: ./App -> App
              const clean = path.replace(/^\\.\\//, '').replace(/\\.(js|jsx|ts|tsx)$/, '');
              
              if (modules[clean]) return modules[clean];
              
              console.warn('Module not found:', path);
              return {};
            };

            // Register function
            window.register = function(id, factory) {
               const module = { exports: {} };
               try {
                  factory(module, module.exports, window.require);
                  modules[id] = module.exports;
               } catch(e) {
                  console.error('Error executing module ' + id, e);
                  showError('Runtime Error in ' + id, e);
               }
            };

            window.showError = function(title, err) {
                const errDiv = document.createElement('div');
                errDiv.style.position = 'fixed';
                errDiv.style.top = '0';
                errDiv.style.left = '0';
                errDiv.style.width = '100%';
                errDiv.style.backgroundColor = '#fee2e2';
                errDiv.style.color = '#b91c1c';
                errDiv.style.padding = '10px';
                errDiv.style.borderBottom = '1px solid #ef4444';
                errDiv.style.zIndex = '9999';
                errDiv.style.fontFamily = 'monospace';
                errDiv.innerHTML = '<strong>' + title + '</strong><pre style="margin-top:5px; white-space:pre-wrap;">' + err.message + '</pre>';
                document.body.appendChild(errDiv);
            }

            window.runCode = function() {
              if (!window.Babel) { 
                 console.error('Babel not loaded'); 
                 return; 
              }

              const scripts = document.querySelectorAll('script[type="text/lemonade"]');
              
              scripts.forEach(script => {
                 const filename = script.getAttribute('data-filename');
                 const rawCode = script.textContent;
                 const id = filename.replace(/\\.(js|jsx|ts|tsx)$/, '');

                 try {
                    // Transpile
                    const output = Babel.transform(rawCode, {
                        presets: ['react', 'env'],
                        filename: filename
                    }).code;

                    // Wrap in module registration using a safer injection method than eval()
                    const wrapperCode = "window.register('" + id + "', function(module, exports, require) {\\n" + output + "\\n});";
                    
                    const newScript = document.createElement('script');
                    newScript.textContent = wrapperCode;
                    document.body.appendChild(newScript);

                 } catch (e) {
                    console.error('Compilation error in ' + filename, e);
                    showError('Compilation Error in ' + filename, e);
                 }
              });
            };
          </script>
        `;

        // 3. Embed User Scripts as data blocks
        const userScripts = scriptFiles.map(f => {
            // Escape script closing tags in content to prevent breaking the HTML
            const safeContent = (f as any).content.replace(/<\/script>/g, '<\\/script>');
            return `<script type="text/lemonade" data-filename="${f.name}">${safeContent}</script>`;
        }).join('\n');

        // 4. Libraries
        const libs = `
           <script src="https://unpkg.com/react@18.2.0/umd/react.development.js" crossorigin></script>
           <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.development.js" crossorigin></script>
           <script src="https://unpkg.com/@babel/standalone@7.23.6/babel.min.js"></script>
        `;

        // 5. Trigger
        const trigger = `<script>window.addEventListener('load', function() { setTimeout(window.runCode, 100); });</script>`;
        
        // Assemble
        if (indexHtml.includes('<head>')) {
             indexHtml = indexHtml.replace('<head>', `<head>${libs}${loaderScript}`);
        } else {
             indexHtml = `<head>${libs}${loaderScript}</head>${indexHtml}`;
        }

        if (indexHtml.includes('</body>')) {
             indexHtml = indexHtml.replace('</body>', `${userScripts}${trigger}</body>`);
        } else {
             indexHtml += `${userScripts}${trigger}`;
        }
        
    } else {
        // Standard HTML/JS
        const scripts = files.filter(f => f.type === 'file' && (f.name.endsWith('.js') || f.name.endsWith('.ts')));
        scriptTags = `<script>${scripts.map(f => (f as any).content).join('\n')}</script>`;
        
        if (indexHtml.includes('</head>')) {
            indexHtml = indexHtml.replace('</head>', `<style>${styles}</style></head>`);
        } else {
            indexHtml = `<head><style>${styles}</style></head>${indexHtml}`;
        }
        
        if (indexHtml.includes('</body>')) {
            indexHtml = indexHtml.replace('</body>', `${scriptTags}</body>`);
        } else {
            indexHtml += scriptTags;
        }
    }

    setSrcDoc(indexHtml);
  }, [files, refreshTrigger]);

  return (
    <div className={`h-full w-full bg-white flex flex-col ${isFullScreen ? 'shadow-2xl' : ''}`}>
      {/* Browser Bar */}
      <div className="bg-gray-100 p-2 border-b flex justify-between items-center text-xs text-gray-600 h-9 shrink-0">
        <div className="flex items-center gap-3 flex-1">
           <div className="flex gap-1.5 group">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 group-hover:bg-red-500 transition-colors"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 group-hover:bg-yellow-500 transition-colors"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 group-hover:bg-green-500 transition-colors"></div>
           </div>
           
           <div className="flex items-center gap-2 bg-white px-2 py-0.5 rounded-md border border-gray-200 flex-1 max-w-md mx-2">
             <Globe size={10} className="opacity-50" /> 
             <span className="opacity-70">localhost:3000</span>
           </div>

           <button 
             onClick={onRefresh}
             className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
             title="Refresh Preview"
           >
             <RotateCw size={12} />
           </button>
        </div>
        
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
        sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
      />
    </div>
  );
};

export default Preview;