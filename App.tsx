import React, { useState, useRef, useEffect } from 'react';
import { AVAILABLE_TASKS, TASK_MODELS } from './constants';
import { TaskConfig, TaskType, GenerationParams } from './types';
import TaskCard from './components/TaskCard';
import PromptLibrary from './components/PromptLibrary';
import { generateSample, saveBatchToDatabase } from './services/geminiService';
import { 
    ChevronLeft, 
    Upload, 
    Play, 
    Layers, 
    Zap, 
    CheckCircle, 
    Loader2, 
    FileAudio, 
    ImageIcon,
    Settings
} from 'lucide-react';

const App: React.FC = () => {
  // -- State --
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedTask, setSelectedTask] = useState<TaskConfig | null>(null);
  const [taskName, setTaskName] = useState('');
  
  // Workspace State
  const [mode, setMode] = useState<'sample' | 'batch'>('sample');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<string[]>([]);
  
  // Params
  const [params, setParams] = useState<GenerationParams>({
    prompt: '',
    aspectRatio: '16:9',
    sampleCount: 2,
    resolution: '720p',
    model: ''
  });

  // Batch Specific State (Audio to Video)
  const [batchCount, setBatchCount] = useState<number>(10);
  const [batchPrompt, setBatchPrompt] = useState('');

  // Files
  const [txtFile, setTxtFile] = useState<File | null>(null);
  const [refImages, setRefImages] = useState<File[]>([]);
  const [driverAudio, setDriverAudio] = useState<File | null>(null);
  const [startImage, setStartImage] = useState<File | null>(null);
  const [endImage, setEndImage] = useState<File | null>(null);

  // Initialize model when task changes
  useEffect(() => {
    if (selectedTask) {
        const availableModels = TASK_MODELS[selectedTask.type];
        if (availableModels && availableModels.length > 0) {
            setParams(p => ({...p, model: availableModels[0].id}));
        }
    }
  }, [selectedTask]);

  // -- Handlers --

  const handleTaskSelect = (task: TaskConfig) => {
    setSelectedTask(task);
    setTaskName(''); // Reset name
  };

  const handleCreateTask = () => {
    if (!selectedTask || !taskName.trim()) return;
    setCurrentStep(2);
    // Reset workspace params
    setPrompt('');
    setGeneratedResults([]);
    setRefImages([]);
    setDriverAudio(null);
    setStartImage(null);
    setEndImage(null);
    setTxtFile(null);
    setBatchPrompt('');
    setBatchCount(10);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleGenerateSample = async () => {
    if (!selectedTask) return;
    setIsGenerating(true);
    setGeneratedResults([]);

    try {
      const results = await generateSample(selectedTask.type, {
        ...params,
        prompt: prompt,
        referenceImages: refImages,
        driverAudio: driverAudio || undefined,
        startImage: startImage || undefined,
        endImage: endImage || undefined
      });
      setGeneratedResults(results);
    } catch (error) {
      alert("Generation failed. Check console or API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStartBatch = async () => {
    if (!selectedTask) return;

    setIsGenerating(true);
    let count = 0;

    // Special case for AudioToVideo: uses manual count + optional prompt
    if (selectedTask.type === TaskType.AudioToVideo) {
        if (!batchCount || batchCount < 1) {
            alert("Please enter a valid generation count.");
            setIsGenerating(false);
            return;
        }
        count = batchCount;
        // Logic to send `batchPrompt` would go here if backend supported it, 
        // for now we just log success with count.
    } 
    // Standard case: File Upload
    else {
        if (!txtFile) {
            alert("Please upload a .txt file.");
            setIsGenerating(false);
            return;
        }
        // Simulate parsing the file to count prompts
        const text = await txtFile.text();
        count = text.split('\n').filter(line => line.trim().length > 0).length;
    }
    
    await saveBatchToDatabase(taskName, count, selectedTask.type);
    
    setIsGenerating(false);
    alert("Batch job submitted successfully! Data sent to database.");
    setTxtFile(null);
  };

  // -- Render Helpers --

  // Render specific inputs based on task type
  const renderInputs = () => {
    if (!selectedTask) return null;

    return (
        <div className="space-y-6">
            {/* Model Selection */}
            <div className="space-y-2">
                <label className="text-xs uppercase font-bold text-slate-400">Model</label>
                <select 
                    value={params.model}
                    onChange={(e) => setParams({...params, model: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                >
                    {TASK_MODELS[selectedTask.type]?.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            {/* Prompt Input (Available for all, optional for some) */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300">Prompt Template</label>
                    <PromptLibrary onSelect={setPrompt} currentPrompt={prompt} />
                </div>
                <textarea
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[120px]"
                    placeholder={selectedTask.type === TaskType.AudioToVideo ? "Describe the motion (optional)..." : "Enter your creative prompt here..."}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
            </div>

            {/* Task Specific Inputs */}
            {selectedTask.type === TaskType.AudioToVideo && (
                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400">Reference Image (Base)</label>
                        <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center hover:bg-slate-800 transition-colors relative">
                             <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setRefImages([e.target.files[0]])} />
                             {refImages.length > 0 ? (
                                 <span className="text-indigo-400 text-sm flex items-center justify-center"><ImageIcon size={16} className="mr-2"/> {refImages[0].name}</span>
                             ) : (
                                 <span className="text-slate-500 text-sm flex flex-col items-center"><ImageIcon className="mb-2"/> Upload Base Image</span>
                             )}
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400">Driver Audio</label>
                         <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center hover:bg-slate-800 transition-colors relative">
                             <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setDriverAudio(e.target.files[0])} />
                             {driverAudio ? (
                                 <span className="text-indigo-400 text-sm flex items-center justify-center"><FileAudio size={16} className="mr-2"/> {driverAudio.name}</span>
                             ) : (
                                 <span className="text-slate-500 text-sm flex flex-col items-center"><FileAudio className="mb-2"/> Upload Audio</span>
                             )}
                        </div>
                     </div>
                </div>
            )}

            {selectedTask.type === TaskType.ImageToVideo && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400">Start Frame</label>
                         <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center hover:bg-slate-800 transition-colors relative">
                             <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setStartImage(e.target.files[0])} />
                              {startImage ? (
                                 <span className="text-indigo-400 text-sm flex items-center justify-center"><ImageIcon size={16} className="mr-2"/> {startImage.name}</span>
                             ) : (
                                 <span className="text-slate-500 text-sm flex flex-col items-center"><ImageIcon className="mb-2"/> Start Image</span>
                             )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400">End Frame (Optional)</label>
                         <div className="border border-dashed border-slate-600 rounded-lg p-4 text-center hover:bg-slate-800 transition-colors relative">
                             <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => e.target.files && setEndImage(e.target.files[0])} />
                              {endImage ? (
                                 <span className="text-indigo-400 text-sm flex items-center justify-center"><ImageIcon size={16} className="mr-2"/> {endImage.name}</span>
                             ) : (
                                 <span className="text-slate-500 text-sm flex flex-col items-center"><ImageIcon className="mb-2"/> End Image</span>
                             )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  };

  const renderBatchUI = () => {
    if (!selectedTask) return null;

    // Special Batch UI for Audio To Video
    if (selectedTask.type === TaskType.AudioToVideo) {
        return (
             <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Batch Configuration</h3>
                
                <div className="space-y-4">
                     {/* Model Select (also in Batch) */}
                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400">Model</label>
                        <select 
                            value={params.model}
                            onChange={(e) => setParams({...params, model: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                        >
                            {TASK_MODELS[selectedTask.type]?.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                     {/* Resolution (also in Batch) */}
                     <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400">Resolution</label>
                        <div className="flex bg-slate-900 rounded p-1 border border-slate-700">
                             {['720p', '1080p'].map(res => (
                                <button
                                    key={res}
                                    onClick={() => setParams({...params, resolution: res as any})}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${params.resolution === res ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {res}
                                </button>
                             ))}
                        </div>
                     </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-slate-400">Prompt (Optional)</label>
                        <textarea
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                            placeholder="Optional prompt template..."
                            value={batchPrompt}
                            onChange={(e) => setBatchPrompt(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-indigo-400">Generation Quantity *</label>
                        <input
                            type="number"
                            min="1"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                            value={batchCount}
                            onChange={(e) => setBatchCount(parseInt(e.target.value) || 0)}
                        />
                        <p className="text-xs text-slate-500">PaaS platform assets will be consumed sequentially.</p>
                    </div>
                </div>
             </div>
        );
    }

    // Standard Batch UI (File Upload)
    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">Batch Processing</h3>
            <p className="text-sm text-slate-400 mb-4">
                Upload a configuration file to process multiple items directly to the database.
            </p>

            <div className="space-y-4 mb-4">
                 {/* Model Select (also in Batch) */}
                <div className="space-y-2">
                    <label className="text-xs uppercase font-bold text-slate-400">Model</label>
                    <select 
                        value={params.model}
                        onChange={(e) => setParams({...params, model: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white focus:ring-2 focus:ring-indigo-500"
                    >
                        {TASK_MODELS[selectedTask.type]?.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>
                 {/* Resolution (if video) */}
                 {selectedTask.type !== TaskType.TextToImage && (
                    <div className="space-y-2">
                         <label className="text-xs uppercase font-bold text-slate-400">Resolution</label>
                         <div className="flex bg-slate-900 rounded p-1 border border-slate-700">
                                {['720p', '1080p'].map(res => (
                                <button
                                    key={res}
                                    onClick={() => setParams({...params, resolution: res as any})}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${params.resolution === res ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {res}
                                </button>
                                ))}
                         </div>
                    </div>
                 )}
            </div>
            
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-slate-400" />
                    <p className="text-sm text-slate-400"><span className="font-semibold">Click to upload</span> .txt file</p>
                </div>
                <input type="file" className="hidden" accept=".txt" onChange={(e) => e.target.files && setTxtFile(e.target.files[0])} />
            </label>
            {txtFile && (
                <div className="mt-2 flex items-center text-sm text-indigo-400">
                    <CheckCircle size={14} className="mr-2"/>
                    {txtFile.name}
                </div>
            )}
        </div>
    );
  };

  // -- Views --

  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-slate-900 p-8 flex flex-col items-center">
        <header className="mb-12 text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl shadow-2xl mb-4">
             <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">
            Gemini Creative Studio
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto">
            Select a generative task to begin your production pipeline.
          </p>
          
          {/* API Key Check / Helper */}
          {!process.env.API_KEY && (
             <div className="bg-amber-900/30 border border-amber-700/50 text-amber-200 px-4 py-2 rounded-lg text-sm max-w-md mx-auto mt-4">
                <strong>Wait!</strong> You need to select a paid API Key (Veo requires it).
                <br/>
                <button 
                    onClick={() => (window as any).aistudio?.openSelectKey()}
                    className="mt-2 bg-amber-700 hover:bg-amber-600 text-white px-3 py-1 rounded transition-colors"
                >
                    Select API Key
                </button>
             </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full max-w-6xl px-4">
          {AVAILABLE_TASKS.map((task) => (
            <TaskCard 
                key={task.id} 
                task={task} 
                onSelect={(t) => {
                    handleTaskSelect(t);
                    // If task is selected, scroll to name input or focus it
                    setTimeout(() => document.getElementById('taskNameInput')?.focus(), 100);
                }} 
            />
          ))}
        </div>

        {selectedTask && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl transform transition-all">
                    <h2 className="text-2xl font-bold text-white mb-2">Create New Task</h2>
                    <p className="text-slate-400 mb-6">Start a new <strong>{selectedTask.name}</strong> session.</p>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">Task Name</label>
                            <input 
                                id="taskNameInput"
                                type="text" 
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                placeholder="e.g., Summer Campaign V1"
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:outline-none focus:border-indigo-500"
                            />
                        </div>
                        <div className="flex space-x-3 pt-2">
                            <button 
                                onClick={() => setSelectedTask(null)}
                                className="flex-1 py-3 text-slate-400 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCreateTask}
                                disabled={!taskName.trim()}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                Create & Enter
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // Step 2: Workspace
  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-slate-800 bg-slate-900/90 flex items-center px-6 justify-between shrink-0 z-20">
            <div className="flex items-center space-x-4">
                <button onClick={handleBack} className="text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft />
                </button>
                <div className="h-6 w-px bg-slate-700 mx-2"></div>
                <div>
                    <h2 className="text-white font-semibold">{taskName}</h2>
                    <span className="text-xs text-indigo-400 uppercase tracking-wider">{selectedTask?.name}</span>
                </div>
            </div>
            
            {/* Mode Switcher */}
            <div className="bg-slate-800 p-1 rounded-lg flex space-x-1">
                <button 
                    onClick={() => setMode('sample')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'sample' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    Sample Verification
                </button>
                <button 
                    onClick={() => setMode('batch')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${mode === 'batch' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                    Batch Generation
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
            {/* Left Panel: Configuration */}
            <div className="w-[400px] border-r border-slate-800 bg-slate-900/50 p-6 overflow-y-auto flex flex-col gap-8 shrink-0">
                
                {mode === 'sample' ? (
                    <>
                        {renderInputs()}

                        <div className="space-y-4 pt-4 border-t border-slate-800">
                            <h3 className="flex items-center text-xs font-bold text-slate-500 uppercase">
                                <Settings size={14} className="mr-2"/> Configuration
                            </h3>
                            
                            {/* Aspect Ratio */}
                            <div className="grid grid-cols-3 gap-2">
                                {['16:9', '1:1', '9:16'].map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setParams({...params, aspectRatio: ratio})}
                                        className={`py-2 text-xs rounded border transition-colors ${params.aspectRatio === ratio ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                            
                            {/* Resolution for Videos */}
                            {selectedTask?.type !== TaskType.TextToImage && (
                                <div className="space-y-2">
                                    <label className="text-xs text-slate-400">Resolution</label>
                                    <div className="flex bg-slate-900 rounded p-1 border border-slate-700">
                                        {['720p', '1080p'].map(res => (
                                            <button
                                                key={res}
                                                onClick={() => setParams({...params, resolution: res as any})}
                                                className={`flex-1 py-1 text-xs font-medium rounded transition-colors ${params.resolution === res ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                            >
                                                {res}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sample Count - Only for images really, but video might allow iterations later */}
                            {selectedTask?.type === TaskType.TextToImage && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-slate-300">Image Count</span>
                                    <div className="flex items-center bg-slate-800 rounded px-2">
                                        <button onClick={() => setParams(p => ({...p, sampleCount: Math.max(1, p.sampleCount - 1)}))} className="p-2 text-slate-400 hover:text-white">-</button>
                                        <span className="mx-2 text-sm text-white w-4 text-center">{params.sampleCount}</span>
                                        <button onClick={() => setParams(p => ({...p, sampleCount: Math.min(4, p.sampleCount + 1)}))} className="p-2 text-slate-400 hover:text-white">+</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleGenerateSample}
                            disabled={isGenerating || (!prompt && !startImage && !refImages.length)}
                            className="w-full mt-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? <Loader2 className="animate-spin" /> : <Play size={20} fill="currentColor" />}
                            <span>Generate Sample</span>
                        </button>
                    </>
                ) : (
                    // BATCH MODE SIDEBAR
                    <div className="flex flex-col h-full">
                         {renderBatchUI()}

                         {/* Common Info Box */}
                         {selectedTask?.type !== TaskType.AudioToVideo && (
                            <div className="bg-slate-900 border border-slate-800 rounded p-4 text-xs text-slate-500 font-mono">
                                <p className="mb-2 uppercase font-bold text-slate-600">Sample Format (prompts.txt)</p>
                                Cyberpunk detective in rain<br/>
                                A calm meadow with flowers<br/>
                                Abstract geometric shapes, 3d render...
                            </div>
                         )}

                         <button 
                            onClick={handleStartBatch}
                            disabled={isGenerating || (selectedTask?.type === TaskType.AudioToVideo ? !batchCount : !txtFile)}
                            className="w-full mt-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                             {isGenerating ? <Loader2 className="animate-spin" /> : <Layers size={20} />}
                            <span>Start Batch Job</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Right Panel: Preview Area */}
            <div className="flex-1 bg-slate-950 p-8 overflow-y-auto relative">
                {mode === 'batch' ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600">
                        <Layers size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium">Batch Mode Active</p>
                        <p className="text-sm">Results are processed in background and sent to database.</p>
                    </div>
                ) : (
                    <>
                        {generatedResults.length === 0 && !isGenerating ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-600">
                                <Zap size={64} className="mb-4 opacity-20" />
                                <p className="text-lg font-medium">Ready to Generate</p>
                                <p className="text-sm">Configure your parameters on the left and hit Generate.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {generatedResults.map((res, idx) => (
                                    <div key={idx} className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl animate-fade-in-up">
                                        {(selectedTask?.type === TaskType.TextToVideo || selectedTask?.type === TaskType.AudioToVideo || selectedTask?.type === TaskType.ImageToVideo) ? (
                                            <video controls className="w-full h-auto" src={res} />
                                        ) : (
                                            <img src={res} alt={`Result ${idx}`} className="w-full h-auto object-cover" />
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                            #{idx + 1}
                                        </div>
                                    </div>
                                ))}
                                {isGenerating && (
                                    <div className="h-64 flex items-center justify-center bg-slate-900/50 border border-slate-800 rounded-xl animate-pulse">
                                        <div className="flex flex-col items-center text-indigo-400">
                                            <Loader2 className="animate-spin mb-2" size={32} />
                                            <span className="text-sm">Dreaming...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default App;