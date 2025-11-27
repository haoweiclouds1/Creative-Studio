import React, { useState, useEffect } from 'react';
import { PromptTemplate } from '../types';
import { Book, Plus, Trash2, Copy, Check } from 'lucide-react';

interface PromptLibraryProps {
  onSelect: (content: string) => void;
  currentPrompt: string;
}

const PromptLibrary: React.FC<PromptLibraryProps> = ({ onSelect, currentPrompt }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');

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
    const name = newTemplateName.trim() || `Template ${templates.length + 1}`;
    const newTemplate: PromptTemplate = {
      id: Date.now().toString(),
      name,
      content: currentPrompt
    };
    setTemplates([...templates, newTemplate]);
    setNewTemplateName('');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTemplates(templates.filter(t => t.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <Book size={16} />
        <span>Prompt Library</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-8 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-4 animate-fade-in-down">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-white">Templates</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">&times;</button>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto mb-4 custom-scrollbar">
            {templates.map(t => (
              <div 
                key={t.id} 
                className="group flex flex-col p-2 rounded hover:bg-slate-700 cursor-pointer border border-transparent hover:border-slate-600 transition-all"
                onClick={() => {
                    onSelect(t.content);
                    setIsOpen(false);
                }}
              >
                <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-200">{t.name}</span>
                    <button 
                        onClick={(e) => handleDelete(t.id, e)}
                        className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
                <p className="text-xs text-slate-400 truncate mt-1">{t.content}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-700">
             <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="New template name..."
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500 mb-2"
             />
             <button
                onClick={handleSaveCurrent}
                disabled={!currentPrompt}
                className="w-full flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-xs py-2 rounded transition-colors"
             >
                <Plus size={14} />
                <span>Save Current Prompt</span>
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptLibrary;
