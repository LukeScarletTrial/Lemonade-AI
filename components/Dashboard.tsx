import React, { useState } from 'react';
import { Plus, Folder, Trash2, Code2, Search, Zap, Server, FileCode } from 'lucide-react';
import { ProjectMeta } from '../types';

interface DashboardProps {
  projects: ProjectMeta[];
  onCreateProject: (name: string, type: 'html' | 'react' | 'node') => void;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  userEmail: string | null;
  onSignOut: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  projects, 
  onCreateProject, 
  onOpenProject, 
  onDeleteProject,
  userEmail,
  onSignOut
}) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<'html' | 'react' | 'node'>('html');
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim(), newProjectType);
      setNewProjectName('');
      setNewProjectType('html'); // reset
      setIsCreating(false);
    }
  };

  const filteredProjects = projects
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.lastModified - a.lastModified);

  const getIcon = (type?: string) => {
      switch(type) {
          case 'react': return <Zap size={20} className="text-blue-400" />;
          case 'node': return <Server size={20} className="text-green-400" />;
          default: return <FileCode size={20} className="text-yellow-400" />;
      }
  };

  return (
    <div className="h-screen w-screen bg-ide-bg text-ide-textMain flex flex-col overflow-hidden">
      {/* Header */}
      <div className="h-16 bg-ide-sidebar border-b border-ide-border flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-400 p-2 rounded-lg text-ide-bg">
            <Code2 size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Lemonade AI <span className="text-xs font-normal opacity-50 ml-2">Dashboard</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-ide-text">{userEmail}</span>
          <button 
            onClick={onSignOut}
            className="text-sm text-ide-text hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-6xl mx-auto">
          
          {/* Controls */}
          <div className="flex justify-between items-center mb-8">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 text-ide-text opacity-50" size={16} />
              <input 
                type="text" 
                placeholder="Search projects..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-ide-activity border border-ide-border rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-ide-accent"
              />
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-ide-accent hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Plus size={16} /> New Project
            </button>
          </div>

          {/* Create Modal/Inline */}
          {isCreating && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
              <div className="bg-ide-sidebar border border-ide-border p-6 rounded-lg shadow-2xl w-96">
                <h3 className="text-lg font-bold mb-4">Create New Project</h3>
                <form onSubmit={handleCreate}>
                  <label className="block text-xs uppercase text-ide-text mb-1">Project Name</label>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="e.g., My Awesome App"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full bg-ide-activity border border-ide-border rounded p-2 text-sm mb-4 focus:border-ide-accent outline-none text-white"
                  />
                  
                  <label className="block text-xs uppercase text-ide-text mb-1">Template</label>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                      <button
                        type="button"
                        onClick={() => setNewProjectType('html')}
                        className={`p-2 rounded border flex flex-col items-center gap-1 text-xs ${newProjectType === 'html' ? 'border-ide-accent bg-ide-activity text-white' : 'border-ide-border text-ide-text hover:bg-ide-hover'}`}
                      >
                          <FileCode size={16} /> HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProjectType('react')}
                        className={`p-2 rounded border flex flex-col items-center gap-1 text-xs ${newProjectType === 'react' ? 'border-ide-accent bg-ide-activity text-white' : 'border-ide-border text-ide-text hover:bg-ide-hover'}`}
                      >
                          <Zap size={16} /> React
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewProjectType('node')}
                        className={`p-2 rounded border flex flex-col items-center gap-1 text-xs ${newProjectType === 'node' ? 'border-ide-accent bg-ide-activity text-white' : 'border-ide-border text-ide-text hover:bg-ide-hover'}`}
                      >
                          <Server size={16} /> Node.js
                      </button>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-3 py-1.5 text-sm text-ide-text hover:text-white"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={!newProjectName.trim()}
                      className="px-3 py-1.5 text-sm bg-ide-accent text-white rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                      Create
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map(project => (
              <div 
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="group bg-ide-sidebar border border-ide-border hover:border-ide-accent rounded-lg p-4 cursor-pointer transition-all hover:shadow-lg relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-ide-activity rounded-md group-hover:bg-ide-bg transition-colors">
                    {getIcon(project.type)}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                    className="p-1.5 text-ide-text opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-ide-bg rounded transition-all"
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <h3 className="font-semibold text-lg truncate mb-1">{project.name}</h3>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] bg-ide-activity px-1.5 py-0.5 rounded text-ide-text uppercase">{project.type || 'HTML'}</span>
                    <p className="text-xs text-ide-text opacity-60">
                    {new Date(project.lastModified).toLocaleDateString()}
                    </p>
                </div>
              </div>
            ))}

            {filteredProjects.length === 0 && !searchTerm && (
               <div 
                 onClick={() => setIsCreating(true)}
                 className="border-2 border-dashed border-ide-border hover:border-ide-accent rounded-lg p-4 flex flex-col items-center justify-center text-ide-text hover:text-ide-accent cursor-pointer min-h-[160px] transition-colors"
               >
                 <Plus size={32} className="mb-2 opacity-50" />
                 <span className="text-sm font-medium">Create your first project</span>
               </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;