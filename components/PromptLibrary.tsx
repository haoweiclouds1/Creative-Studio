import React, { useState, useEffect } from 'react';
import { PromptTemplate } from '../types';
import { Book, Plus, Trash2, Search, X, Edit3, Save, Copy } from 'lucide-react';

interface PromptLibraryProps {
  onSelect: (content: string) => void;
  currentPrompt: string;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ onSelect, currentPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{name: string, content: string}>({ name: '', content: '' });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('gemini_prompt_templates');
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
        // Defaults
        setTemplates([
            { id: '1', name: 'Cinematic Lighting', content: 'Cinematic lighting, 8k resolution, highly detailed, photorealistic, dramatic shadows' },
            { id: '2', name: 'Cyberpunk City', content: 'Cyberpunk city at night, neon lights, rain reflections, futuristic skyscrapers, flying cars, atmosphere' }
        ]);
    }
  }, []);

  // Save to localStorage whenever templates change
  useEffect(() => {
    localStorage.setItem('gemini_prompt_templates', JSON.stringify(templates));
  }, [templates]);

  const handleSaveCurrent = () => {
    if (!currentPrompt.trim()) return;
    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      name: `Template ${templates.length + 1}`,
      content: currentPrompt
    };
    setTemplates([newTemplate, ...templates]);
    // Automatically enter edit mode for the new one to let user name it
    setEditingId(newTemplate.id);
    setEditForm({ name: newTemplate.name, content: newTemplate.content });
  };

  const startEdit = (t: PromptTemplate) => {
    setEditingId(t.id);
    setEditForm({ name: t.name, content: t.content });
  };

  const saveEdit = () => {
    if (!editingId) return;
    setTemplates(templates.map(t => 
        t.id === editingId ? { ...t, name: editForm.name, content: editForm.content } : t
    ));
    setEditingId(null);
  };

  const deleteTemplate = (id: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
        setTemplates(templates.filter(t => t.id !== id));
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
        <button
            onClick={() => setIsOpen(true)}
            className="flex items-center space-x-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
        >
            <Book size={16} />
            <span>Prompt Library</span>
        </button>

        {isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                    {/* Header */}
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Prompt Template Library</h2>
                            <p className="text-slate-400 text-sm">Manage and reuse your prompt templates.</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Toolbar */}
                    <div className="p-4 bg-slate-800/50 flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-800">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search templates..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button 
                            onClick={handleSaveCurrent}
                            disabled={!currentPrompt}
                            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                        >
                            <Plus size={16} />
                            <span>Save Current Prompt</span>
                        </button>
                    </div>

                    {/* Content List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/50 custom-scrollbar">
                        {filteredTemplates.length === 0 ? (
                            <div className="text-center text-slate-500 py-12">
                                <Book size={48} className="mx-auto mb-4 opacity-20" />
                                <p>No templates found.</p>
                            </div>
                        ) : (
                            filteredTemplates.map(template => (
                                <div key={template.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4 transition-all hover:border-slate-600 group">
                                    {editingId === template.id ? (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold">Template Name</label>
                                                <input 
                                                    value={editForm.name}
                                                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mt-1 focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Enter template name..."
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-slate-500 uppercase font-bold">Content</label>
                                                <textarea 
                                                    value={editForm.content}
                                                    onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mt-1 h-32 focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Enter prompt content..."
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={() => setEditingId(null)} className="px-3 py-1 text-slate-400 hover:text-white text-sm">Cancel</button>
                                                <button onClick={saveEdit} className="flex items-center space-x-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-sm">
                                                    <Save size={14} /> <span>Save Changes</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-white text-lg">{template.name}</h3>
                                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => startEdit(template)}
                                                        className="p-2 text-slate-400 hover:text-indigo-400 rounded-full hover:bg-slate-700"
                                                        title="Edit"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteTemplate(template.id)}
                                                        className="p-2 text-slate-400 hover:text-red-400 rounded-full hover:bg-slate-700"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-slate-400 text-sm line-clamp-3 mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-800/50">
                                                {template.content}
                                            </p>
                                            <div className="flex justify-end">
                                                <button 
                                                    onClick={() => {
                                                        onSelect(template.content);
                                                        setIsOpen(false);
                                                    }}
                                                    className="flex items-center space-x-2 text-indigo-400 hover:text-white bg-slate-700/50 hover:bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-all"
                                                >
                                                    <span>Use Template</span>
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default PromptLibrary;