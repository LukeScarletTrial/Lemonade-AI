import React, { useState, useEffect } from 'react';
import { PanelLeft, Play, LogOut, Save, Code, Eye, FileCode, ArrowLeft, Download, GitBranch } from 'lucide-react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { FileSystemItem, ChatMessage, AIResponseSchema, AIProvider, ProjectMeta, Commit } from './types';
import { INITIAL_FILES, REACT_TEMPLATE, NODE_TEMPLATE } from './constants';
import { generateCodeChanges } from './services/aiService';
import FileExplorer from './components/FileExplorer';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import AIChat from './components/AIChat';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import SourceControl from './components/SourceControl';
import { exportProjectAsZip } from './utils/exportUtils';

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // --- Project Management State ---
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  // --- Editor State ---
  const [files, setFiles] = useState<FileSystemItem[]>(INITIAL_FILES);
  const [activeFileId, setActiveFileId] = useState<string | null>('index-html');
  
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'files' | 'git'>('files');
  
  // View Mode: 'code' or 'preview'
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [isFullScreenPreview, setIsFullScreenPreview] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [logs, setLogs] = useState<string[]>(['Lemonade AI initialized.']);
  const [previewRefresh, setPreviewRefresh] = useState(0);
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);

  // --- Initialization & Migration ---
  useEffect(() => {
    // 1. Load Project List
    const storedProjects = localStorage.getItem('lemonade_projects_list');
    let loadedProjects: ProjectMeta[] = [];
    
    if (storedProjects) {
        loadedProjects = JSON.parse(storedProjects);
    }

    // 2. Migration Check: Do we have legacy single-project data?
    const legacyFiles = localStorage.getItem('lemonade_project_files');
    if (legacyFiles) {
        // Create a migration project
        const migrationId = `proj-${Date.now()}`;
        const newProject: ProjectMeta = {
            id: migrationId,
            name: 'Imported Project',
            lastModified: Date.now()
        };
        
        // Save files to new key
        localStorage.setItem(`lemonade_project_${migrationId}`, legacyFiles);
        
        // Add to list
        loadedProjects.push(newProject);
        
        // Remove old key
        localStorage.removeItem('lemonade_project_files');
        
        console.log("Migrated legacy project to", migrationId);
    }

    setProjects(loadedProjects);
    localStorage.setItem('lemonade_projects_list', JSON.stringify(loadedProjects));
  }, []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Project Actions ---

  const handleCreateProject = (name: string, type: 'html' | 'react' | 'node' = 'html') => {
    const newId = `proj-${Date.now()}`;
    const newProject: ProjectMeta = {
        id: newId,
        name: name,
        type: type,
        lastModified: Date.now(),
        commits: []
    };

    const newProjectList = [...projects, newProject];
    setProjects(newProjectList);
    localStorage.setItem('lemonade_projects_list', JSON.stringify(newProjectList));

    // Init files based on template
    let defaultFiles = INITIAL_FILES;
    if (type === 'react') defaultFiles = REACT_TEMPLATE;
    if (type === 'node') defaultFiles = NODE_TEMPLATE;

    localStorage.setItem(`lemonade_project_${newId}`, JSON.stringify(defaultFiles));
    
    // Open it
    setFiles(defaultFiles);
    setCommits([]);
    setMessages([]);
    setLogs(['Project created.']);
    setActiveProjectId(newId);
    setViewMode('code');
  };

  const handleOpenProject = (id: string) => {
    const rawFiles = localStorage.getItem(`lemonade_project_${id}`);
    const projectMeta = projects.find(p => p.id === id);

    if (rawFiles && projectMeta) {
        try {
            const parsed = JSON.parse(rawFiles);
            setFiles(parsed);
            setActiveProjectId(id);
            setMessages([]);
            setLogs([`Opened project ${id}`]);
            setViewMode('code');
            setIsFullScreenPreview(false);
            setCommits(projectMeta.commits || []);
            
            // Set default active file if exists
            let indexFile = parsed.find((f: FileSystemItem) => f.name === 'index.html');
            if (projectMeta.type === 'react' || projectMeta.type === 'node') {
                indexFile = parsed.find((f: FileSystemItem) => f.name === 'App.jsx' || f.name === 'index.js');
            }
            if (indexFile) setActiveFileId(indexFile.id);
            else if (parsed.length > 0) setActiveFileId(parsed[0].id);

        } catch (e) {
            console.error("Error opening project", e);
            alert("Failed to open project files.");
        }
    } else {
        alert("Project data not found.");
    }
  };

  const handleDeleteProject = (id: string) => {
     if (window.confirm("Are you sure you want to delete this project? This cannot be undone.")) {
         const newList = projects.filter(p => p.id !== id);
         setProjects(newList);
         localStorage.setItem('lemonade_projects_list', JSON.stringify(newList));
         localStorage.removeItem(`lemonade_project_${id}`);
         
         if (activeProjectId === id) {
             setActiveProjectId(null);
         }
     }
  };

  const handleCloseProject = () => {
      handleSaveProject(); // Auto save on close
      setActiveProjectId(null);
      setIsFullScreenPreview(false);
  };

  // --- Editor Actions ---
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleSaveProject = () => {
    if (!activeProjectId) return;

    // Save Files
    localStorage.setItem(`lemonade_project_${activeProjectId}`, JSON.stringify(files));
    
    // Update Meta (including commits)
    const updatedProjects = projects.map(p => 
        p.id === activeProjectId ? { ...p, lastModified: Date.now(), commits: commits } : p
    );
    setProjects(updatedProjects);
    localStorage.setItem('lemonade_projects_list', JSON.stringify(updatedProjects));

    setLastSaved(Date.now());
    addLog("Project saved.");
  };

  const handleExport = () => {
      const currentProjectName = projects.find(p => p.id === activeProjectId)?.name || 'project';
      exportProjectAsZip(currentProjectName, files);
      addLog("Exported project to ZIP.");
  };

  const handleFileClick = (id: string) => {
    setActiveFileId(id);
    setViewMode('code'); // Switch to code view when a file is selected
    if (isFullScreenPreview) setIsFullScreenPreview(false); // Exit fullscreen if selecting code
  };

  const handleContentChange = (newContent: string) => {
    if (!activeFileId) return;
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  };

  const handleCreateFile = (name: string) => {
      const newFile: FileSystemItem = {
        id: `file-${Date.now()}`,
        name,
        type: 'file',
        content: '',
        language: name.split('.').pop() || 'plaintext'
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFileId(newFile.id);
      setViewMode('code');
      addLog(`Created file: ${name}`);
  };

  const handleRenameFile = (id: string, newName: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const newLanguage = newName.split('.').pop() || 'plaintext';
        return { ...f, name: newName, language: newLanguage };
      }
      return f;
    }));
    addLog(`Renamed file to ${newName}`);
  };

  const handleUploadFiles = async (fileList: FileList) => {
    const newFiles: FileSystemItem[] = [];
    
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const text = await file.text();
        const ext = file.name.split('.').pop() || 'text';
        
        newFiles.push({
            id: `file-${Date.now()}-${i}`,
            name: file.webkitRelativePath || file.name,
            type: 'file',
            content: text,
            language: ext
        });
    }

    if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
        addLog(`Uploaded ${newFiles.length} files.`);
    }
  };

  const handleDeleteFile = (id: string) => {
    if (window.confirm("Delete this file?")) {
        setFiles(prev => prev.filter(f => f.id !== id));
        if (activeFileId === id) setActiveFileId(null);
        addLog(`Deleted file ID: ${id}`);
    }
  };

  const handleRun = () => {
    addLog("Compiling and reloading preview...");
    setPreviewRefresh(prev => prev + 1);
    if (!isFullScreenPreview) setViewMode('preview'); 
  };

  const handleSignOut = () => {
    signOut(auth);
  };

  // --- Git Actions ---
  const handleCommit = (message: string) => {
      const newCommit: Commit = {
          id: `commit-${Date.now()}`,
          message,
          timestamp: Date.now(),
          files: JSON.parse(JSON.stringify(files)) // Deep copy
      };
      setCommits(prev => [...prev, newCommit]);
      addLog(`Committed: ${message}`);
      handleSaveProject();
  };

  const handleRestore = (commit: Commit) => {
      if (window.confirm(`Restore state to "${commit.message}"? Unsaved changes will be lost.`)) {
          setFiles(JSON.parse(JSON.stringify(commit.files))); // Deep copy
          setPreviewRefresh(prev => prev + 1);
          addLog(`Restored commit: ${commit.message}`);
      }
  };

  // --- AI Logic ---
  const handleSendMessage = async (text: string, provider: AIProvider, model: string, apiKey: string) => {
    // Add User Message
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessingAI(true);
    addLog(`AI Request (${provider}): "${text}"`);

    try {
        const result: AIResponseSchema = await generateCodeChanges(text, files, { provider, model, apiKey });
        
        // Add Explanation Message
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: result.explanation, timestamp: Date.now() };
        setMessages(prev => [...prev, aiMsg]);

        // Execute Actions
        if (result.actions && result.actions.length > 0) {
            const newFiles = [...files];
            
            result.actions.forEach(action => {
                if (action.type === 'create') {
                    const existingIdx = newFiles.findIndex(f => f.name === action.filePath);
                    if (existingIdx === -1) {
                         newFiles.push({
                            id: `ai-${Date.now()}-${Math.random()}`,
                            name: action.filePath,
                            content: action.content || '',
                            type: 'file',
                            language: action.filePath.split('.').pop() || 'text'
                         });
                         addLog(`AI Created: ${action.filePath}`);
                    } else {
                         newFiles[existingIdx] = { ...newFiles[existingIdx] as any, content: action.content || '' };
                         addLog(`AI Updated (Overwrite): ${action.filePath}`);
                    }
                } else if (action.type === 'update') {
                    const idx = newFiles.findIndex(f => f.name === action.filePath);
                    if (idx !== -1) {
                        newFiles[idx] = { ...newFiles[idx] as any, content: action.content || '' };
                        addLog(`AI Updated: ${action.filePath}`);
                    } else {
                         newFiles.push({
                            id: `ai-${Date.now()}-${Math.random()}`,
                            name: action.filePath,
                            content: action.content || '',
                            type: 'file',
                            language: action.filePath.split('.').pop() || 'text'
                         });
                         addLog(`AI Created (Fallback): ${action.filePath}`);
                    }
                } else if (action.type === 'delete') {
                    const idx = newFiles.findIndex(f => f.name === action.filePath);
                    if (idx !== -1) {
                        newFiles.splice(idx, 1);
                        addLog(`AI Deleted: ${action.filePath}`);
                    }
                }
            });

            setFiles(newFiles);
            setPreviewRefresh(prev => prev + 1); // Auto run after AI edits
            
            // Auto-save after AI changes
            // Note: We don't update 'lastModified' on every AI change to prevent spamming list reorders, 
            // but we do save the file content to storage.
            if (activeProjectId) {
                localStorage.setItem(`lemonade_project_${activeProjectId}`, JSON.stringify(newFiles));
            }
        }

    } catch (err) {
        const errorMsg: ChatMessage = { 
            id: Date.now().toString(), 
            role: 'system', 
            content: `Error: ${err instanceof Error ? err.message : 'Unknown error'}`, 
            timestamp: Date.now() 
        };
        setMessages(prev => [...prev, errorMsg]);
        addLog(`AI Error: ${err}`);
    } finally {
        setIsProcessingAI(false);
    }
  };

  // --- Render ---

  if (isAuthLoading) {
    return <div className="h-screen w-screen bg-ide-bg flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  // Dashboard View
  if (!activeProjectId) {
      return (
          <Dashboard 
            projects={projects}
            onCreateProject={handleCreateProject}
            onOpenProject={handleOpenProject}
            onDeleteProject={handleDeleteProject}
            userEmail={user.email}
            onSignOut={handleSignOut}
          />
      );
  }

  // Editor View
  const activeFile = files.find(f => f.id === activeFileId) || null;
  const currentProjectName = projects.find(p => p.id === activeProjectId)?.name || 'Untitled';

  return (
    <div className="flex flex-col h-screen w-screen bg-ide-bg text-ide-textMain overflow-hidden">
      
      {/* 1. Header / Activity Bar */}
      <div className="h-10 bg-ide-activity flex items-center justify-between px-4 border-b border-ide-border">
        <div className="flex items-center gap-4">
           <button 
             onClick={handleCloseProject}
             className="p-1 rounded hover:bg-ide-hover text-ide-text hover:text-white"
             title="Back to Dashboard"
           >
             <ArrowLeft size={16} />
           </button>
           <span className="font-bold text-yellow-400 tracking-tight flex items-center gap-2">
             Lemonade AI <span className="text-xs font-normal text-ide-text opacity-50">/ {currentProjectName}</span>
           </span>
           <button onClick={() => setShowSidebar(!showSidebar)} className={`p-1 rounded ${showSidebar ? 'bg-ide-hover' : ''}`}>
               <PanelLeft size={16} />
           </button>
           <button 
             onClick={handleSaveProject} 
             className="flex items-center gap-1 text-xs text-ide-text hover:text-white transition-colors"
             title="Save to Browser Storage"
            >
              <Save size={14} /> {lastSaved ? 'Saved' : 'Save'}
           </button>
        </div>

        <div className="flex items-center gap-4">
            <button
                onClick={handleExport}
                className="flex items-center gap-1 text-xs text-ide-text hover:text-white transition-colors"
                title="Download Project ZIP"
            >
                <Download size={14} /> Export
            </button>
            <button 
                onClick={handleRun}
                className="flex items-center gap-2 px-3 py-1 bg-green-700 hover:bg-green-600 text-white rounded text-xs transition-colors"
            >
                <Play size={12} /> Run Preview
            </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        {showSidebar && (
             <div className="w-64 shrink-0 flex flex-col transition-all duration-300 border-r border-ide-border bg-ide-sidebar">
                {/* Sidebar Tabs */}
                <div className="flex border-b border-ide-border">
                    <button 
                        onClick={() => setActiveSidebarTab('files')}
                        className={`flex-1 py-2 text-xs flex justify-center hover:bg-ide-hover transition-colors ${activeSidebarTab === 'files' ? 'text-white border-b-2 border-ide-accent' : 'text-ide-text'}`}
                        title="Explorer"
                    >
                        <FileCode size={16} />
                    </button>
                    <button 
                        onClick={() => setActiveSidebarTab('git')}
                        className={`flex-1 py-2 text-xs flex justify-center hover:bg-ide-hover transition-colors ${activeSidebarTab === 'git' ? 'text-white border-b-2 border-ide-accent' : 'text-ide-text'}`}
                        title="Source Control"
                    >
                        <GitBranch size={16} />
                    </button>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-hidden">
                    {activeSidebarTab === 'files' ? (
                        <FileExplorer 
                            files={files} 
                            activeFileId={activeFileId} 
                            onFileClick={handleFileClick}
                            onDeleteFile={handleDeleteFile}
                            onCreateFile={handleCreateFile}
                            onUploadFiles={handleUploadFiles}
                            onRenameFile={handleRenameFile}
                        />
                    ) : (
                        <SourceControl 
                            commits={commits}
                            onCommit={handleCommit}
                            onRestore={handleRestore}
                        />
                    )}
                </div>
             </div>
        )}

        {/* Center: Main Window (Toggles between Editor and Preview) */}
        <div className="flex-1 flex flex-col min-w-0 bg-ide-bg relative">
             
             {/* Tab Bar / Toolbar - Only show if not full screen preview */}
             {!isFullScreenPreview && (
                <div className="flex bg-ide-header h-9 items-center px-4 justify-between border-b border-ide-border shrink-0 select-none">
                    {/* Active File Label */}
                    <div className="flex items-center gap-2 text-xs text-ide-textMain max-w-[50%] truncate">
                        {activeFile ? (
                            <>
                            <FileCode size={14} className="text-blue-400 shrink-0"/>
                            <span className="truncate">{activeFile.name}</span>
                            </>
                        ) : (
                            <span className="opacity-50 italic">No file selected</span>
                        )}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex bg-ide-activity rounded p-0.5">
                        <button
                            onClick={() => setViewMode('code')}
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
                                viewMode === 'code' 
                                ? 'bg-ide-accent text-white shadow-sm' 
                                : 'text-ide-text hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Code size={12} /> Code
                        </button>
                        <button
                            onClick={() => setViewMode('preview')}
                            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded transition-colors ${
                                viewMode === 'preview' 
                                ? 'bg-ide-accent text-white shadow-sm' 
                                : 'text-ide-text hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Eye size={12} /> Preview
                        </button>
                    </div>
                </div>
             )}

             {/* Content Area */}
             <div className="flex-1 overflow-hidden relative">
                 {/* Code Editor */}
                 <div className={`absolute inset-0 transition-opacity duration-200 ${viewMode === 'code' && !isFullScreenPreview ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'}`}>
                     <CodeEditor activeFile={activeFile} onContentChange={handleContentChange} />
                 </div>

                 {/* Preview Container */}
                 <div 
                    className={`
                        transition-all duration-200 bg-white
                        ${isFullScreenPreview ? 'fixed inset-0 z-50' : 'absolute inset-0'}
                        ${(viewMode === 'preview' || isFullScreenPreview) ? 'opacity-100' : 'opacity-0 pointer-events-none z-0'}
                    `}
                 >
                     <Preview 
                        files={files} 
                        refreshTrigger={previewRefresh}
                        onRefresh={handleRun}
                        isFullScreen={isFullScreenPreview}
                        onToggleFullScreen={() => {
                            if (!isFullScreenPreview) {
                                // Entering Full Screen
                                setIsFullScreenPreview(true);
                            } else {
                                // Exiting Full Screen
                                setIsFullScreenPreview(false);
                                setViewMode('preview'); // Ensure we stay in preview mode
                            }
                        }}
                     />
                 </div>
             </div>
        </div>

        {/* Right Sidebar: AI Chat */}
        <div className="w-80 shrink-0 border-l border-ide-border bg-ide-sidebar z-20">
            <AIChat 
              messages={messages} 
              files={files}
              onSendMessage={handleSendMessage} 
              isProcessing={isProcessingAI}
            />
        </div>

      </div>

      {/* 3. Status Bar */}
      <div className="h-6 bg-ide-activity border-t border-ide-border flex items-center px-2 text-[10px] text-ide-text select-none justify-between shrink-0">
          <div className="flex gap-4">
             <span>{user.email}</span>
             <span>master*</span>
             {lastSaved && <span>Last saved: {new Date(lastSaved).toLocaleTimeString()}</span>}
          </div>
          <div className="flex gap-4">
             <span className="uppercase">{isFullScreenPreview ? 'FULLSCREEN' : `${viewMode} MODE`}</span>
             <span>UTF-8</span>
             <span>{activeFile?.type === 'file' ? activeFile.language : 'Plain Text'}</span>
          </div>
      </div>
    </div>
  );
};

export default App;