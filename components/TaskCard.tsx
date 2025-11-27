import React from 'react';
import { TaskConfig } from '../types';
import * as Icons from 'lucide-react';

interface TaskCardProps {
  task: TaskConfig;
  onSelect: (task: TaskConfig) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onSelect }) => {
  // Dynamic Icon rendering
  const IconComponent = (Icons as any)[task.icon] || Icons.HelpCircle;

  return (
    <div 
      onClick={() => onSelect(task)}
      className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-300 transform hover:-translate-y-1"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
      
      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-slate-900 rounded-full text-indigo-400 group-hover:text-indigo-300 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all">
          <IconComponent size={32} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-indigo-200 transition-colors">
            {task.name}
          </h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {task.description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
