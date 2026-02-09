import React, { useRef, useState, useEffect } from 'react';
import { FileText, ChevronRight, ChevronDown, Plus, Trash2, Upload, FolderInput, FilePlus, MoreHorizontal } from 'lucide-react';
import { FileSystemItem } from '../types';

interface FileExplorerProps {
  files: FileSystemItem[];
  activeFileId: string | null;
  onFileClick: (id: string) => void;
  onDeleteFile: (id: string) => void;
  onCreateFile: (name: string) => void; // Changed from () => void to accept name
  onUploadFiles: (files: FileList) => void;
  onRenameFile: (id: string, newName: string) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  activeFileId, 
  onFileClick,
  onDeleteFile,
  onCreateFile,
  onUploadFiles,
  onRenameFile
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  
  // State for new file creation
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      const dotIndex = editName.lastIndexOf('.');
      if (dotIndex > 0) {
        editInputRef.current.setSelectionRange(0, dotIndex);
      } else {
        editInputRef.current.select();
      }
    }
  }, [editingId]);

  // Focus input when creating starts
  useEffect(() => {
    if (isCreating && createInputRef.current) {
        createInputRef.current.focus();
    }
  }, [isCreating]);

  const handleUploadClick = (type: 'file' | 'folder') => {
    setIsMenuOpen(false);
    if (type === 'file' && fileInputRef.current) {
      fileInputRef.current.click();
    } else if (type === 'folder' && folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUploadFiles(e.target.files);
    }
    e.target.value = '';
  };

  const startEditing = (e: React.MouseEvent, item: FileSystemItem) => {
    e.stopPropagation();
    if (item.type === 'file') {
      setEditingId(item.id);
      setEditName(item.name);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEditing = () => {
    if (editingId && editName.trim()) {
      onRenameFile(editingId, editName.trim());
    }
    cancelEditing();
  };

  // Creation Logic
  const handleCreateClick = () => {
      setIsCreating(true);
      setNewFileName('');
  };

  const saveCreation = () => {
      if (newFileName.trim()) {
          onCreateFile(newFileName.trim());
      }
      setIsCreating(false);
      setNewFileName('');
  };

  const cancelCreation = () => {
      setIsCreating(false);
      setNewFileName('');
  };

  const handleCreateKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          saveCreation();
      } else if (e.key === 'Escape') {
          cancelCreation();
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const renderItem = (item: FileSystemItem, depth: number = 0) => {
    const isFile = item.type === 'file';
    const isActive = item.id === activeFileId;
    const isEditing = item.id === editingId;
    
    const paddingLeft = `${depth * 12 + 12}px`;

    return (
      <div
        key={item.id}
        className={`group flex items-center py-1 cursor-pointer select-none text-sm border-l-2 transition-colors duration-100
          ${isActive 
            ? 'bg-[#094771] text-white border-ide-accent' 
            : 'text-ide-text border-transparent hover:bg-[#2a2d2e] hover:text-white'
          }
        `}
        style={{ paddingLeft }}
        onClick={() => isFile && !isEditing && onFileClick(item.id)}
        onDoubleClick={(e) => startEditing(e, item)}
      >
        <span className={`mr-1.5 ${isActive ? 'text-white' : 'text-ide-text opacity-70 group-hover:text-white'}`}>
          {isFile ? <FileText size={14} /> : (item.isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
        </span>
        
        {isEditing ? (
          <input
            ref={editInputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveEditing}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-[#3c3c3c] text-white outline-none border border-ide-accent px-1 h-5 rounded"
          />
        ) : (
          <span className="truncate flex-1">{item.name}</span>
        )}
        
        {isFile && !isEditing && (
           <button 
             onClick={(e) => { e.stopPropagation(); onDeleteFile(item.id); }}
             className={`mr-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-700 ${isActive ? 'text-white' : 'text-ide-text'}`}
             title="Delete"
           >
             <Trash2 size={12} />
           </button>
        )}
      </div>
    );
  };

  const sortedFiles = [...files].sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'folder' ? -1 : 1;
  });

  return (
    <div className="h-full flex flex-col bg-ide-sidebar border-r border-ide-border relative">
      {/* Hidden Inputs for Upload */}
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        className="hidden" 
        onChange={onFileInputChange} 
      />
      <input 
        type="file" 
        // @ts-ignore
        webkitdirectory="" 
        directory="" 
        multiple 
        ref={folderInputRef} 
        className="hidden" 
        onChange={onFileInputChange} 
      />

      <div className="h-9 px-3 text-xs font-bold uppercase tracking-wider text-ide-text flex justify-between items-center select-none bg-ide-sidebar z-10">
        <span>Explorer</span>
        <div className="flex items-center gap-1">
          {/* Dedicated New File Button */}
          <button 
             onClick={handleCreateClick} 
             className="p-1 rounded hover:bg-ide-hover transition-colors text-ide-text hover:text-white"
             title="New File"
          >
             <Plus size={16} />
          </button>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)} 
              className={`p-1 rounded hover:bg-ide-hover transition-colors ${isMenuOpen ? 'bg-ide-hover text-white' : ''}`} 
              title="More Actions"
            >
              <MoreHorizontal size={16} />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#252526] border border-[#454545] shadow-xl rounded-md z-50 overflow-hidden flex flex-col py-1">
                <button 
                  className="flex items-center gap-2 px-3 py-2 text-left hover:bg-[#094771] hover:text-white text-ide-text transition-colors"
                  onClick={() => { setIsMenuOpen(false); handleCreateClick(); }}
                >
                  <FilePlus size={14} /> <span>New File</span>
                </button>
                <div className="h-[1px] bg-[#454545] my-1 mx-2" />
                <button 
                  className="flex items-center gap-2 px-3 py-2 text-left hover:bg-[#094771] hover:text-white text-ide-text transition-colors"
                  onClick={() => handleUploadClick('file')}
                >
                  <Upload size={14} /> <span>Upload Files</span>
                </button>
                <button 
                  className="flex items-center gap-2 px-3 py-2 text-left hover:bg-[#094771] hover:text-white text-ide-text transition-colors"
                  onClick={() => handleUploadClick('folder')}
                >
                  <FolderInput size={14} /> <span>Upload Folder</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Inline Create Input */}
        {isCreating && (
             <div className="flex items-center py-1 px-3 border-l-2 border-transparent bg-ide-activity">
                 <span className="mr-1.5 text-ide-text opacity-70">
                    <FileText size={14} />
                 </span>
                 <input
                    ref={createInputRef}
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    onBlur={saveCreation}
                    onKeyDown={handleCreateKeyDown}
                    placeholder="filename.txt"
                    className="flex-1 bg-[#3c3c3c] text-white outline-none border border-ide-accent px-1 h-5 rounded text-sm"
                 />
             </div>
        )}

        {sortedFiles.map(file => renderItem(file))}
      </div>
    </div>
  );
};

export default FileExplorer;