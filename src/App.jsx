import React, { useState, useEffect, useRef } from 'react';
import { 
  Layout, 
  Send, 
  Settings, 
  Image as ImageIcon, 
  Twitter, 
  Linkedin, 
  Plus, 
  User,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Layers,
  Users,
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  FileText,
  Image,
  RefreshCcw,
  Clock,
  Menu,
  X,
  Lightbulb,
  Check,
  Pen,
  Eye,
  EyeOff,
  ClipboardList,
  StickyNote,
  Trash2,
  GripHorizontal,
  Minus,
  History
} from 'lucide-react';

const PLATFORMS = [
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-500', border: 'border-blue-500/50' },
  { id: 'twitter', name: 'Twitter / X', icon: Twitter, color: 'text-sky-400', border: 'border-sky-400/50' },
];

const PROFILE_GROUPS = [
  { 
    id: 'systemzero', 
    name: 'SystemZero', 
    type: 'business', 
    icon: User,
    logo: '/SystemZeroLogo.webp',
    webhookSourcePrefix: 'SystemZero',
    webhookUrl: "/api/webhook/webhook/917cbc1e-16e8-4c6e-b619-92ff9d1c1cd8"
  },
  { 
    id: 'nocodecj', 
    name: 'NoCodeCJ', 
    type: 'business', 
    icon: User,
    logo: '/Logo2NoCodeCJ.webp',
    webhookSourcePrefix: 'NoCodeCJ',
    webhookUrl: "/api/webhook/webhook/917cbc1e-16e8-4c6e-b619-92ff9d1c1cd8"
  },
  { 
    id: 'adrian', 
    name: 'Adrian', 
    type: 'business', 
    icon: User,
    logo: '/Adrian.webp',
    webhookSourcePrefix: 'Adrian',
    webhookUrl: "/api/webhook/webhook/917cbc1e-16e8-4c6e-b619-92ff9d1c1cd8"
  },
  { 
    id: 'jacek', 
    name: 'Jacek', 
    type: 'business', 
    icon: User,
    logo: '/Jacek.webp',
    webhookSourcePrefix: 'Jacek',
    webhookUrl: "/api/webhook/webhook/917cbc1e-16e8-4c6e-b619-92ff9d1c1cd8"
  }
];

const NOTE_COLORS = [
  { id: 'white', class: 'bg-white border-slate-300', label: 'Biały' },
  { id: 'yellow', class: 'bg-yellow-400 border-yellow-500', label: 'Żółty' },
  { id: 'green', class: 'bg-emerald-400 border-emerald-500', label: 'Zielony' },
  { id: 'blue', class: 'bg-sky-400 border-sky-500', label: 'Niebieski' },
  { id: 'purple', class: 'bg-purple-400 border-purple-500', label: 'Fioletowy' }
];

const TaskTimer = ({ endTime }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!endTime) return;

    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const distance = end - now;

      if (distance < 0) {
        setIsExpired(true);
        setTimeLeft('00:00:00');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (!endTime) return null;
  
  return (
    <div className={`flex items-center gap-1 text-xs font-mono px-2 py-1 rounded border min-w-fit ${isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-300 border-blue-500/20'}`}>
      <Clock size={12} />
      <span>{isExpired ? 'Koniec czasu' : timeLeft}</span>
    </div>
  );
};

const INITIAL_PROFILE_STATE = {
  content: '',
  shortContent: '',
  imageUrl: '',
  manualContent: '',
  manualShortContent: '',
  manualImageUrl: '',
  isManualMode: false,
  generationStatus: 'idle',
  publishingStatus: 'idle'
};

function App() {
  // Init state from localStorage
  const [activeProfile, setActiveProfile] = useState(() => localStorage.getItem('saved_active_profile') || 'systemzero');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('saved_view_mode') || 'menu');
  
  // Notes State
  const [notes, setNotes] = useState(() => JSON.parse(localStorage.getItem('saved_notes') || '[]'));
  const [noteInput, setNoteInput] = useState('');
  const [selectedNoteColor, setSelectedNoteColor] = useState(NOTE_COLORS[0]);
  const [draggedNote, setDraggedNote] = useState(null);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editNoteInput, setEditNoteInput] = useState('');

  // Tasks State
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('saved_tasks') || '[]'));
  const [taskInput, setTaskInput] = useState('');
  const [selectedTaskOwners, setSelectedTaskOwners] = useState(['adrian', 'jacek']);
  
  // Task Timer State
  const [isTimerEnabled, setIsTimerEnabled] = useState(false);
  const [timerHours, setTimerHours] = useState(1);

  // Mass Actions State
  const [isGlobalGenerating, setIsGlobalGenerating] = useState(false);
  const [selectedProfilesForGeneration, setSelectedProfilesForGeneration] = useState([]);

  const [isGlobalPublishing, setIsGlobalPublishing] = useState(false);
  const [selectedProfilesForPublishing, setSelectedProfilesForPublishing] = useState([]);

  const [publishingTargets, setPublishingTargets] = useState({});
  
  // Unified State for all profiles
  const [profilesState, setProfilesState] = useState(() => {
    const saved = localStorage.getItem('saved_profiles_state');
    if (saved) {
      const state = JSON.parse(saved);
      // Ensure new profiles exist in saved state
      if (!state.adrian) state.adrian = { ...INITIAL_PROFILE_STATE };
      if (!state.jacek) state.jacek = { ...INITIAL_PROFILE_STATE };
      return state;
    }
    
    // Migration: Try to recover legacy single-profile state for SystemZero
    return {
      systemzero: {
        content: localStorage.getItem('saved_content') || '',
        shortContent: localStorage.getItem('saved_short_content') || '',
        imageUrl: localStorage.getItem('saved_image_url') || '',
        manualContent: localStorage.getItem('saved_manual_content') || '',
        manualShortContent: localStorage.getItem('saved_manual_short_content') || '',
        manualImageUrl: localStorage.getItem('saved_manual_image_url') || '',
        isManualMode: localStorage.getItem('saved_is_manual_mode') === 'true',
        generationStatus: localStorage.getItem('saved_generation_status') || 'idle',
        publishingStatus: 'idle'
      },
      nocodecj: { ...INITIAL_PROFILE_STATE },
      adrian: { ...INITIAL_PROFILE_STATE },
      jacek: { ...INITIAL_PROFILE_STATE }
    };
  });

  const [status, setStatus] = useState('idle'); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Ref to track first mount to avoid resetting view on reload
  const isMounted = useRef(false);

  // Helpers to access/update current profile state
  const currentProfileData = PROFILE_GROUPS.find(p => p.id === activeProfile) || PROFILE_GROUPS[0];
  const currentState = profilesState[activeProfile] || INITIAL_PROFILE_STATE;

  const updateProfileState = (id, updates) => {
    setProfilesState(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || INITIAL_PROFILE_STATE),
        ...updates
      }
    }));
  };

  const updateCurrentProfile = (updates) => {
    updateProfileState(activeProfile, updates);
  };

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('saved_active_profile', activeProfile);
  }, [activeProfile]);

  useEffect(() => {
    localStorage.setItem('saved_view_mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('saved_profiles_state', JSON.stringify(profilesState));
  }, [profilesState]);

  useEffect(() => {
    localStorage.setItem('saved_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('saved_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (!draggedNote) return;
    const draggedIndex = notes.findIndex(n => n.id === draggedNote.id);
    if (draggedIndex === index) return;

    const newNotes = [...notes];
    const draggedItem = newNotes[draggedIndex];
    newNotes.splice(draggedIndex, 1);
    newNotes.splice(index, 0, draggedItem);
    setNotes(newNotes);
  };

  const handleDragEnd = () => {
    setDraggedNote(null);
  };

  const handleStartEditNote = (note) => {
    setEditingNoteId(note.id);
    setEditNoteInput(note.text);
  };

  const handleSaveEditNote = () => {
    if (!editNoteInput.trim()) return;
    setNotes(prev => prev.map(note => 
      note.id === editingNoteId ? { ...note, text: editNoteInput } : note
    ));
    setEditingNoteId(null);
    setEditNoteInput('');
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setEditNoteInput('');
  };

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const newNote = {
      id: Date.now(),
      text: noteInput,
      timestamp: new Date().toISOString(),
      color: selectedNoteColor.class,
      completed: false
    };
    setNotes(prev => [newNote, ...prev]); // Add to top
    setNoteInput('');
  };

  const handleToggleNote = (id) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, completed: !note.completed } : note
    ));
  };

  const handleDeleteNote = (id) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const handleAddTask = () => {
    if (!taskInput.trim()) return;
    if (selectedTaskOwners.length === 0) {
      alert("Wybierz przynajmniej jedną osobę (Adrian lub Jacek)!");
      return;
    }

    let timerEndTime = null;
    if (isTimerEnabled) {
      const h = parseInt(timerHours) || 0;
      
      if (h > 24) {
        alert("Maksymalny czas to 24 godziny!");
        return;
      }
      if (h <= 0) {
        alert("Ustaw czas na minimum 1 godzinę!");
        return;
      }

      const totalMs = h * 3600 * 1000;
      timerEndTime = new Date(Date.now() + totalMs).toISOString();
    }

    const newTasks = selectedTaskOwners.map(owner => ({
      id: Date.now() + Math.random(), // Ensure unique ID even for simultaneous creates
      text: taskInput,
      completed: false,
      timestamp: new Date().toISOString(),
      owner: owner,
      timerEndTime: timerEndTime
    }));

    setTasks(prev => [...newTasks, ...prev]);
    setTaskInput('');
    setIsTimerEnabled(false);
    setTimerHours(1);
  };

  const toggleTaskOwner = (ownerId) => {
    setSelectedTaskOwners(prev => 
      prev.includes(ownerId)
        ? prev.filter(id => id !== ownerId)
        : [...prev, ownerId]
    );
  };

  const handleToggleTask = (id) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const getProfileName = (id) => {
    return PROFILE_GROUPS.find(p => p.id === id)?.name || id;
  };

  const handleGenerateContent = async (profileId = null) => {
    const targetId = profileId || activeProfile;
    const targetProfileData = PROFILE_GROUPS.find(p => p.id === targetId);

    if (!targetProfileData) return;

    if (!targetProfileData.webhookUrl) {
      if (!profileId) alert(`Brak skonfigurowanego Webhooka dla profilu ${targetProfileData.name}.`);
      console.warn(`Brak webhooka dla ${targetProfileData.name}`);
      return;
    }

    updateProfileState(targetId, { generationStatus: 'loading', isManualMode: false });
    // Czyścimy stare dane
    updateProfileState(targetId, { content: '', shortContent: '', imageUrl: '' });

    try {
      console.log(`Wysyłanie prośby o wygenerowanie treści dla ${targetProfileData.name}...`);
      
      const source = `NowyWpis${targetProfileData.webhookSourcePrefix}`;

      const response = await fetch(targetProfileData.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: source,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Błąd sieci: ${response.status}`);
      }

      const data = await response.json();
      console.log(`Otrzymano dane dla ${targetProfileData.name}:`, data);

      updateProfileState(targetId, {
        content: data.longContent || '',
        shortContent: data.shortContent || '',
        imageUrl: data.imageUrl || '',
        generationStatus: 'done'
      });

    } catch (error) {
      console.error(`Błąd podczas generowania dla ${targetProfileData.name}:`, error);
      if (!profileId) alert('Nie udało się wygenerować treści.');
      updateProfileState(targetId, { generationStatus: 'idle' });
    }
  };

  const toggleProfileForGeneration = (profileId) => {
    setSelectedProfilesForGeneration(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const toggleProfileForPublishing = (profileId) => {
    setSelectedProfilesForPublishing(prev => 
      prev.includes(profileId)
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleGlobalGenerate = async () => {
    if (isGlobalGenerating) return;
    
    const activeGroups = PROFILE_GROUPS.filter(p => selectedProfilesForGeneration.includes(p.id));
    
    if (activeGroups.length === 0) {
      alert("Wybierz przynajmniej jeden profil do wygenerowania!");
      return;
    }

    setIsGlobalGenerating(true);

    for (let i = 0; i < activeGroups.length; i++) {
      const group = activeGroups[i];
      await handleGenerateContent(group.id);

      // Wait 50 seconds if not the last item
      if (i < activeGroups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50000));
      }
    }

    setIsGlobalGenerating(false);
  };

  const handleSend = async (profileId = null) => {
    const targetId = profileId || activeProfile;
    const targetProfileData = PROFILE_GROUPS.find(p => p.id === targetId);
    const targetState = profilesState[targetId] || INITIAL_PROFILE_STATE;

    if (!targetProfileData.webhookUrl) {
      if (!profileId) alert(`Brak skonfigurowanego Webhooka dla profilu ${targetProfileData.name}.`);
      return;
    }

    if (!profileId) setStatus('loading');
    updateProfileState(targetId, { publishingStatus: 'loading' });

    // Wybierz odpowiednie dane w zależności od trybu
    const payloadContent = targetState.isManualMode ? targetState.manualContent : targetState.content;
    const payloadShortContent = targetState.isManualMode ? targetState.manualShortContent : targetState.shortContent;
    const payloadImageUrl = targetState.isManualMode ? targetState.manualImageUrl : targetState.imageUrl;

    const source = `Publikacja${targetProfileData.webhookSourcePrefix}`;

    const payload = {
      source: source,
      mode: targetState.isManualMode ? "manual" : "ai",
      longContent: payloadContent,
      shortContent: payloadShortContent,
      imageUrl: payloadImageUrl,
      timestamp: new Date().toISOString()
    };

    console.log(`Wysyłanie danych do webhooka (${targetProfileData.name})...`, payload);

    try {
      // Wysyłamy bezpośrednio do zdefiniowanego URL
      const response = await fetch(targetProfileData.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Odpowiedź serwera:', responseText);

      if (!profileId) {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }
      updateProfileState(targetId, { publishingStatus: 'success' });
      setTimeout(() => updateProfileState(targetId, { publishingStatus: 'done' }), 2000);

    } catch (error) {
      console.error('Błąd podczas wysyłania:', error);
      if (!profileId) {
        alert('Błąd wysyłania: ' + error.message);
        setStatus('error');
        setTimeout(() => setStatus('idle'), 3000);
      }
      updateProfileState(targetId, { publishingStatus: 'error' });
      setTimeout(() => updateProfileState(targetId, { publishingStatus: 'idle' }), 3000);
    }
  };

  const handleGlobalPublish = async () => {
    if (isGlobalPublishing) return;
    
    const activeGroups = PROFILE_GROUPS.filter(p => selectedProfilesForPublishing.includes(p.id));
    
    if (activeGroups.length === 0) {
      alert("Wybierz przynajmniej jeden profil do publikacji!");
      return;
    }

    setIsGlobalPublishing(true);

    for (let i = 0; i < activeGroups.length; i++) {
      const group = activeGroups[i];
      await handleSend(group.id);

      // Wait 30 seconds if not the last item
      if (i < activeGroups.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    setIsGlobalPublishing(false);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30 overflow-hidden">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-64
      `}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <h1 className="font-bold text-lg tracking-tight">MisterMister</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Zarządzanie</h3>
          <div className="space-y-1 mb-8">
            <button
              onClick={() => {
                setViewMode('control_panel');
                setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                viewMode === 'control_panel'
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Settings size={18} />
              <span className="font-medium text-sm">Panel sterowania</span>
            </button>
          </div>

          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Profile</h3>
          <div className="space-y-1">
            {PROFILE_GROUPS.map(group => (
              <div key={group.id}>
                <button
                  onClick={() => {
                    setActiveProfile(group.id);
                    setViewMode('menu');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                    activeProfile === group.id && viewMode === 'menu'
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <group.icon size={18} />
                  <span className="font-medium text-sm">{group.name}</span>
                </button>
              </div>
            ))}
          </div>

          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 mt-8 px-2">Wyzwania</h3>
          <div className="space-y-1">
             <button
                onClick={() => {
                  setViewMode('tasks');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  viewMode === 'tasks'
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <ClipboardList size={18} />
                <span className="font-medium text-sm">Zadania</span>
              </button>
              <button
                onClick={() => {
                  setViewMode('notes');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  viewMode === 'notes'
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <StickyNote size={18} />
                <span className="font-medium text-sm">Notatki</span>
              </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-950 p-4 md:p-8 w-full">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
          
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800 pb-4 sticky top-0 bg-slate-950/90 backdrop-blur-sm z-30 pt-2">
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                >
                  <Menu size={24} />
                </button>

                {(viewMode === 'manual_post' || viewMode === 'create_post' || viewMode === 'inspiration') && (
                  <button 
                    onClick={() => {
                      setViewMode('menu');
                      updateCurrentProfile({ generationStatus: 'idle' });
                    }}
                    className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="rotate-180" />
                  </button>
                )}
                <h1 className="text-xl md:text-3xl font-bold text-white truncate">
                  {viewMode === 'control_panel' ? 'Panel sterowania' : viewMode === 'tasks' ? 'Zadania' : viewMode === 'notes' ? 'Notatki' : getProfileName(activeProfile)}
                </h1>
             </div>
             
             {viewMode === 'control_panel' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center">
                        <Settings className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-white">Ustawienia aplikacji</h2>
                        <p className="text-slate-400 text-sm">Zarządzaj konfiguracją i integracjami</p>
                      </div>
                    </div>
                    
                    {/* Mass Generator */}
                    <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-6 flex flex-col items-center gap-6">
                      <div className="w-full flex justify-center gap-4 md:gap-8 flex-wrap">
                        {PROFILE_GROUPS.map(group => {
                          const status = profilesState[group.id]?.generationStatus || 'idle';
                          const isSelected = selectedProfilesForGeneration.includes(group.id);
                          const isLoading = status === 'loading';
                          const isDone = status === 'done';
                          
                          return (
                            <button 
                              key={group.id} 
                              onClick={() => toggleProfileForGeneration(group.id)}
                              disabled={isGlobalGenerating}
                              className="flex flex-col items-center gap-3 group relative"
                              title={isSelected ? "Kliknij, aby pominąć" : "Kliknij, aby dołączyć"}
                            >
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 relative ${
                                !isSelected 
                                  ? 'bg-slate-950 border-slate-800 text-slate-700 opacity-60 scale-95'
                                  : isLoading 
                                    ? 'bg-blue-600/20 border-blue-500 animate-pulse text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105'
                                    : isDone 
                                      ? 'bg-white border-emerald-500 text-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                      : 'bg-white border-white text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105'
                              }`}>
                                {isLoading ? <Loader2 className="animate-spin" size={24} /> : group.icon ? <group.icon size={24} /> : <User size={24} />}
                                
                                {/* Status Indicator (Success/Done) */}
                                {isDone && isSelected && !isLoading && (
                                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-md border-2 border-white z-10">
                                    <CheckCircle2 size={12} />
                                  </div>
                                )}

                                {/* Selection Indicator (Pending) */}
                                {isSelected && !isDone && !isLoading && (
                                  <div className="absolute -top-1 -right-1 bg-slate-900 text-white rounded-full p-0.5 shadow-md border border-white">
                                    <Check size={10} strokeWidth={4} />
                                  </div>
                                )}
                              </div>
                              <span className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                                isSelected ? (isLoading ? 'text-blue-400' : 'text-white') : 'text-slate-700'
                              }`}>
                                {group.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="w-full max-w-md">
                        <button
                          onClick={handleGlobalGenerate}
                          disabled={isGlobalGenerating}
                          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                            isGlobalGenerating 
                              ? 'bg-slate-800 text-slate-400 cursor-wait border border-slate-700'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/30 hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                        >
                          {isGlobalGenerating ? (
                            <>
                              <Loader2 className="animate-spin" />
                              <span>Generowanie sekwencyjne...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles size={24} />
                              <span>Generuj posty</span>
                            </>
                          )}
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-3">
                          Proces uruchomi generowanie dla każdego profilu z 50-sekundowym odstępem.
                        </p>
                      </div>
                    </div>

                    {/* Mass Publisher */}
                    <div className="bg-slate-950/50 rounded-lg border border-slate-800 p-6 flex flex-col items-center gap-6 mt-6">
                      <div className="w-full flex justify-center gap-4 md:gap-8 flex-wrap">
                        {PROFILE_GROUPS.map(group => {
                          const status = profilesState[group.id]?.publishingStatus || 'idle';
                          const isSelected = selectedProfilesForPublishing.includes(group.id);
                          const isLoading = status === 'loading';
                          const isSuccess = status === 'success' || status === 'done';
                          const isError = status === 'error';
                          
                          return (
                            <button 
                              key={group.id} 
                              onClick={() => toggleProfileForPublishing(group.id)}
                              disabled={isGlobalPublishing}
                              className="flex flex-col items-center gap-3 group relative"
                              title={isSelected ? "Kliknij, aby pominąć" : "Kliknij, aby dołączyć"}
                            >
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 relative ${
                                !isSelected 
                                  ? 'bg-slate-950 border-slate-800 text-slate-700 opacity-60 scale-95'
                                  : isLoading 
                                    ? 'bg-indigo-600/20 border-indigo-500 animate-pulse text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-105'
                                    : isSuccess
                                      ? 'bg-white border-white text-slate-900 shadow-[0_0_10px_rgba(34,197,94,0.3)]'
                                      : isError
                                        ? 'bg-red-900/20 border-red-500 text-red-400'
                                        : 'bg-white border-white text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:scale-105'
                              }`}>
                                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} className={isSuccess || (isSelected && !isLoading && !isError) ? "text-slate-900" : ""} />}
                                
                                {/* Status Indicator (Success) */}
                                {isSuccess && isSelected && !isLoading && (
                                  <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 shadow-md border-2 border-white z-10">
                                    <CheckCircle2 size={12} />
                                  </div>
                                )}

                                {/* Status Indicator (Error) */}
                                {isError && isSelected && !isLoading && (
                                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md border-2 border-white z-10">
                                    <AlertCircle size={12} />
                                  </div>
                                )}

                                {/* Selection Indicator (Pending) */}
                                {isSelected && !isSuccess && !isLoading && !isError && (
                                  <div className="absolute -top-1 -right-1 bg-slate-900 text-white rounded-full p-0.5 shadow-md border border-white">
                                    <Check size={10} strokeWidth={4} />
                                  </div>
                                )}
                              </div>
                              <span className={`text-xs font-bold uppercase tracking-wide transition-colors ${
                                isSelected ? (isLoading ? 'text-indigo-400' : isSuccess ? 'text-white' : isError ? 'text-red-400' : 'text-white') : 'text-slate-700'
                              }`}>
                                {group.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="w-full max-w-md">
                        <button
                          onClick={handleGlobalPublish}
                          disabled={isGlobalPublishing}
                          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                            isGlobalPublishing 
                              ? 'bg-slate-800 text-slate-400 cursor-wait border border-slate-700'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/30 hover:scale-[1.02] active:scale-[0.98]'
                          }`}
                        >
                          {isGlobalPublishing ? (
                            <>
                              <Loader2 className="animate-spin" />
                              <span>Publikowanie sekwencyjne...</span>
                            </>
                          ) : (
                            <>
                              <Send size={24} />
                              <span>Publikuj posty</span>
                            </>
                          )}
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-3">
                          Proces uruchomi publikację dla każdego profilu z 30-sekundowym odstępem.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sekcja Ostatnie Wpisy */}
                  <div className="flex items-center gap-3 border-b border-slate-800 pb-2 mt-8">
                     <History className="text-slate-500" />
                     <h2 className="text-lg font-bold text-slate-300">Ostatnie wpisy</h2>
                  </div>

                  <div className="space-y-8">
                    {PROFILE_GROUPS.map(group => {
                       const state = profilesState[group.id] || INITIAL_PROFILE_STATE;
                       const isManual = state.isManualMode;
                       
                       const updateState = (updates) => {
                         setProfilesState(prev => ({
                           ...prev,
                           [group.id]: {
                             ...(prev[group.id] || INITIAL_PROFILE_STATE),
                             ...updates
                           }
                         }));
                       };

                       return (
                         <div key={group.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col shadow-lg transition-all duration-300">
                           {/* Header */}
                           <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${state.generationStatus === 'done' ? 'border-b border-slate-800 pb-4 mb-6' : ''}`}>
                             <div className="flex items-center gap-4 w-full sm:w-auto">
                               <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center overflow-hidden border border-blue-500/20 shrink-0">
                                 {group.logo ? (
                                   <img src={group.logo} alt={group.name} className="w-full h-full object-cover" />
                                 ) : (
                                    <group.icon size={24} className="text-blue-400" />
                                 )}
                               </div>
                               <div>
                                 <h3 className="text-lg font-bold text-white">{group.name}</h3>
                                 <p className="text-sm text-slate-400">
                                   {state.generationStatus === 'done' 
                                     ? (isManual ? 'Tryb Ręczny' : 'Tryb AI') 
                                     : 'Oczekiwanie'}
                                 </p>
                               </div>
                             </div>

                             {/* Buttons */}
                             <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                                <button 
                                  onClick={() => updateState({ generationStatus: 'done', isManualMode: false })}
                                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                >
                                  <Eye size={16} />
                                  <span>Zobacz ostatni wpis</span>
                                </button>

                                <button 
                                  onClick={() => updateState({ generationStatus: 'done', isManualMode: true })}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                                    isManual 
                                      ? 'bg-slate-700 text-white ring-1 ring-slate-500' 
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  <Pen size={16} />
                                  <span>Wpis ręczny</span>
                                </button>

                                {state.generationStatus === 'done' && (
                                  <button 
                                    onClick={() => updateState({ generationStatus: 'idle' })}
                                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                  >
                                    <EyeOff size={16} />
                                    <span>Ukryj</span>
                                  </button>
                                )}
                             </div>
                           </div>

                           {/* Content Grid - Visible only if done */}
                           {state.generationStatus === 'done' && (
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                               {/* Long Text */}
                               <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold text-slate-500 uppercase">Tekst Długi {isManual ? '(Ręczny)' : '(AI)'}</label>
                                  <textarea 
                                    value={isManual ? state.manualContent : state.content}
                                    onChange={(e) => isManual ? updateState({ manualContent: e.target.value }) : updateState({ content: e.target.value })}
                                    placeholder={isManual ? "Wpisz ręcznie..." : "Wygenerowana treść..."}
                                    className="w-full flex-1 bg-slate-950/50 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none resize-none text-sm leading-relaxed min-h-[200px]" 
                                  />
                               </div>

                               {/* Short Text */}
                               <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold text-emerald-500/80 uppercase">Tekst Krótki {isManual ? '(Ręczny)' : '(AI)'}</label>
                                  <textarea 
                                    value={isManual ? state.manualShortContent : state.shortContent}
                                    onChange={(e) => isManual ? updateState({ manualShortContent: e.target.value }) : updateState({ shortContent: e.target.value })}
                                    placeholder={isManual ? "Wpisz ręcznie..." : "Wygenerowana treść..."}
                                    className="w-full flex-1 bg-slate-950/50 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none resize-none text-sm leading-relaxed min-h-[200px]" 
                                  />
                               </div>

                               {/* Image */}
                               <div className="flex flex-col gap-2">
                                  <label className="text-xs font-semibold text-purple-500/80 uppercase">Zdjęcie {isManual ? '(Ręczny)' : '(AI)'}</label>
                                  <div className="flex flex-col gap-3 h-full">
                                    <input 
                                      type="text" 
                                      value={isManual ? state.manualImageUrl : state.imageUrl}
                                      onChange={(e) => isManual ? updateState({ manualImageUrl: e.target.value }) : updateState({ imageUrl: e.target.value })}
                                      placeholder="URL zdjęcia..."
                                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
                                    />
                                    <div className="flex-1 bg-slate-950/50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 min-h-[150px] relative group">
                                      {(isManual ? state.manualImageUrl : state.imageUrl) ? (
                                        <>
                                          <img src={isManual ? state.manualImageUrl : state.imageUrl} alt="Post content" className="max-w-full max-h-full object-contain" />
                                          <button 
                                            onClick={() => isManual ? updateState({ manualImageUrl: '' }) : updateState({ imageUrl: '' })}
                                            className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                            title="Usuń zdjęcie"
                                          >
                                            <X size={14} />
                                          </button>
                                        </>
                                      ) : (
                                        <div className="text-slate-600 flex flex-col items-center gap-2">
                                          <Image size={24} className="opacity-50" />
                                          <span className="text-xs">Brak zdjęcia</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                               </div>
                             </div>
                           )}
                         </div>
                       );
                    })}
                  </div>
                </div>
             )}

             {viewMode === 'tasks' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-140px)]">
                  
                  {/* Kolumny zadań */}
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden min-h-0">
                    
                    {/* Kolumna Adriana */}
                    <div className="flex flex-col gap-2 min-h-0">
                      <div className="flex items-center gap-2 px-2 text-blue-400 font-bold uppercase tracking-wider text-sm">
                        <User size={16} /> <span>Adrian</span>
                      </div>
                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto shadow-inner custom-scrollbar">
                        <div className="space-y-3">
                          {tasks.filter(t => t.owner === 'adrian' || !t.owner).length === 0 ? (
                             <p className="text-slate-600 text-center text-sm py-8 italic">Brak zadań dla Adriana</p>
                          ) : (
                            tasks.filter(t => t.owner === 'adrian' || !t.owner).map(task => (
                              <div 
                                key={task.id} 
                                className={`flex items-start gap-3 p-3 border rounded-lg group transition-all ${
                                  task.completed 
                                    ? 'bg-slate-900/50 border-slate-800 opacity-75' 
                                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                                }`}
                              >
                                <button 
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`flex-shrink-0 transition-colors mt-0.5 ${
                                    task.completed ? 'text-green-500' : 'text-slate-500 hover:text-slate-400'
                                  }`}
                                >
                                  {task.completed ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 border-2 border-current rounded-full" />}
                                </button>
                                
                                <span className={`flex-1 text-sm whitespace-pre-wrap break-words max-h-[150px] overflow-y-auto pr-2 custom-scrollbar ${
                                  task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                                }`}>
                                  {task.text}
                                </span>
                                
                                {task.timerEndTime && (
                                  <div className="flex-shrink-0">
                                    <TaskTimer endTime={task.timerEndTime} />
                                  </div>
                                )}

                                <button 
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-slate-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Usuń zadanie"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Kolumna Jacka */}
                    <div className="flex flex-col gap-2 min-h-0">
                      <div className="flex items-center gap-2 px-2 text-purple-400 font-bold uppercase tracking-wider text-sm">
                        <User size={16} /> <span>Jacek</span>
                      </div>
                      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto shadow-inner custom-scrollbar">
                         <div className="space-y-3">
                          {tasks.filter(t => t.owner === 'jacek').length === 0 ? (
                             <p className="text-slate-600 text-center text-sm py-8 italic">Brak zadań dla Jacka</p>
                          ) : (
                            tasks.filter(t => t.owner === 'jacek').map(task => (
                              <div 
                                key={task.id} 
                                className={`flex items-start gap-3 p-3 border rounded-lg group transition-all ${
                                  task.completed 
                                    ? 'bg-slate-900/50 border-slate-800 opacity-75' 
                                    : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
                                }`}
                              >
                                <button 
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`flex-shrink-0 transition-colors mt-0.5 ${
                                    task.completed ? 'text-green-500' : 'text-slate-500 hover:text-slate-400'
                                  }`}
                                >
                                  {task.completed ? <CheckCircle2 size={24} /> : <div className="w-6 h-6 border-2 border-current rounded-full" />}
                                </button>
                                
                                <span className={`flex-1 text-sm whitespace-pre-wrap break-words max-h-[150px] overflow-y-auto pr-2 custom-scrollbar ${
                                  task.completed ? 'line-through text-slate-500' : 'text-slate-200'
                                }`}>
                                  {task.text}
                                </span>
                                
                                {task.timerEndTime && (
                                  <div className="flex-shrink-0">
                                    <TaskTimer endTime={task.timerEndTime} />
                                  </div>
                                )}

                                <button 
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="text-slate-500 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Usuń zadanie"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Pole dodawania */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-lg">
                    
                    <div className="flex flex-wrap items-center gap-4 justify-between">
                      {/* Wybór właściciela */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleTaskOwner('adrian')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedTaskOwners.includes('adrian')
                              ? 'bg-blue-600/20 text-blue-400 border-blue-600/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {selectedTaskOwners.includes('adrian') ? <CheckCircle2 size={16} /> : <div className="w-[16px]" />}
                          Adrian
                        </button>
                        <button
                          onClick={() => toggleTaskOwner('jacek')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedTaskOwners.includes('jacek')
                              ? 'bg-purple-600/20 text-purple-400 border-purple-600/50'
                              : 'bg-slate-950 text-slate-500 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {selectedTaskOwners.includes('jacek') ? <CheckCircle2 size={16} /> : <div className="w-[16px]" />}
                          Jacek
                        </button>
                      </div>

                      {/* Timer Toggle & Inputs */}
                      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <button
                          onClick={() => setIsTimerEnabled(!isTimerEnabled)}
                          className={`p-2 rounded-md transition-all ${isTimerEnabled ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                          title="Ustaw timer (max 24h)"
                        >
                          <Clock size={18} />
                        </button>
                        
                        {isTimerEnabled && (
                          <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-200 px-1">
                            <button 
                              onClick={() => setTimerHours(h => Math.max(1, h - 1))}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              disabled={timerHours <= 1}
                            >
                              <Minus size={16} />
                            </button>
                            
                            <span className="font-mono font-bold text-white text-sm w-8 text-center">{timerHours}h</span>
                            
                            <button 
                              onClick={() => setTimerHours(h => Math.min(24, h + 1))}
                              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
                              disabled={timerHours >= 24}
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 w-full">
                      <input
                        type="text"
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddTask();
                          }
                        }}
                        placeholder="Treść zadania..."
                        className="flex-1 bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none text-sm h-[50px]"
                      />
                      <button
                        onClick={handleAddTask}
                        disabled={!taskInput.trim()}
                        className="h-[50px] px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Plus size={24} />
                        <span className="hidden sm:inline">Dodaj</span>
                      </button>
                    </div>
                  </div>
                </div>
             )}

             {viewMode === 'notes' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-[calc(100vh-140px)]">
                  {/* Tablica notatek */}
                  <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-y-auto shadow-inner bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
                    {notes.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                        <StickyNote size={48} className="mb-2" />
                        <p>Brak notatek. Dodaj pierwszą poniżej!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notes.map((note, index) => (
                          <div 
                            key={note.id} 
                            draggable={!editingNoteId}
                            onDragStart={(e) => handleDragStart(e, note)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`${note.color || 'bg-white border-slate-200'} text-slate-900 p-4 rounded-lg shadow-lg border hover:-translate-y-1 transition-all duration-200 relative group flex flex-col h-auto ${draggedNote?.id === note.id ? 'opacity-40 scale-95' : 'opacity-100'}`}
                          >
                            {/* Drag Handle */}
                            {!editingNoteId && (
                              <div className="absolute top-2 right-2 cursor-move text-slate-900/20 hover:text-slate-900 transition-colors p-1" title="Przeciągnij, aby zmienić kolejność">
                                <GripHorizontal size={20} />
                              </div>
                            )}

                            {editingNoteId === note.id ? (
                              <div className="flex flex-col gap-3 h-full">
                                <textarea
                                  autoFocus
                                  value={editNoteInput}
                                  onChange={(e) => setEditNoteInput(e.target.value)}
                                  className="w-full flex-1 bg-white/50 text-slate-900 p-2 rounded border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm min-h-[100px] resize-none"
                                />
                                <div className="flex justify-end gap-2">
                                  <button onClick={handleCancelEditNote} className="px-2 py-1 text-[10px] uppercase font-bold text-slate-500 hover:text-slate-700">Anuluj</button>
                                  <button onClick={handleSaveEditNote} className="px-3 py-1 bg-blue-600 text-white rounded text-[10px] uppercase font-bold hover:bg-blue-500">Zapisz</button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className={`whitespace-pre-wrap text-sm leading-relaxed max-h-[250px] overflow-y-auto pr-8 custom-scrollbar ${note.completed ? 'line-through opacity-60' : ''}`}>{note.text}</p>
                                <div className="mt-4 flex justify-between items-end border-t border-black/5 pt-2">
                                   <span className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{new Date(note.timestamp).toLocaleDateString()}</span>
                                   <div className="flex gap-1 bg-black/5 px-2 py-1 rounded-full border border-black/5">
                                     <button 
                                       onClick={() => handleToggleNote(note.id)}
                                       className={`p-1 transition-all ${note.completed ? 'text-green-600' : 'text-slate-500 hover:text-green-600'}`}
                                       title={note.completed ? "Cofnij wykonanie" : "Oznacz jako wykonane"}
                                     >
                                       <Check size={16} />
                                     </button>
                                     <button 
                                       onClick={() => handleStartEditNote(note)}
                                       className="p-1 text-slate-500 hover:text-blue-600 transition-colors"
                                       title="Edytuj notatkę"
                                     >
                                       <Pen size={16} />
                                     </button>
                                     <button 
                                       onClick={() => handleDeleteNote(note.id)}
                                       className="p-1 text-slate-500 hover:text-red-600 transition-colors"
                                       title="Usuń notatkę"
                                     >
                                       <Trash2 size={16} />
                                     </button>
                                   </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Pole dodawania */}
                  <div className="mt-auto bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
                    {/* Wybór koloru */}
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs text-slate-500 uppercase font-semibold">Kolor:</span>
                      <div className="flex gap-2">
                        {NOTE_COLORS.map(color => (
                          <button
                            key={color.id}
                            onClick={() => setSelectedNoteColor(color)}
                            className={`w-6 h-6 rounded-full border ${color.class.split(' ')[0]} ${color.class.split(' ')[1]} transition-transform hover:scale-110 ${selectedNoteColor.id === color.id ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 scale-110' : ''}`}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-4 items-end">
                      <textarea
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddNote();
                          }
                        }}
                        placeholder="Wpisz treść nowej notatki..."
                        className="flex-1 bg-slate-950 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none resize-none text-sm min-h-[80px]"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!noteInput.trim()}
                        className="h-[80px] px-6 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg font-bold transition-all flex flex-col items-center justify-center gap-2 shadow-lg"
                      >
                        <Plus size={24} />
                        <span>Dodaj</span>
                      </button>
                    </div>
                  </div>
                </div>
             )}
             
             {viewMode === 'menu' && (
               <div className="space-y-6">
                 {/* Profile Card */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4">
                     <div className="flex items-center gap-4 w-full sm:w-auto">
                       <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center overflow-hidden border border-blue-500/20 shrink-0">
                         {currentProfileData.logo ? (
                           <img src={currentProfileData.logo} alt={currentProfileData.name} className="w-full h-full object-cover" />
                         ) : (
                            <currentProfileData.icon size={24} className="text-blue-400" />
                         )}
                       </div>
                       <div>
                         <h3 className="text-lg font-bold text-white">{currentProfileData.name}</h3>
                         <p className="text-sm text-slate-400">Profil {currentProfileData.type === 'business' ? 'Biznesowy' : 'Osobisty'}</p>
                       </div>
                     </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <button 
                          onClick={() => {
                            updateCurrentProfile({ generationStatus: 'done', isManualMode: false });
                          }}
                          disabled={currentState.generationStatus === 'loading'}
                          className="w-full sm:w-auto px-4 py-2 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-slate-800"
                        >
                          <Eye size={18} />
                          <span>Zobacz ostatni wpis</span>
                        </button>

                        <button 
                          onClick={handleGenerateContent}
                          disabled={currentState.generationStatus === 'loading'}
                          className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                        >
                          {currentState.generationStatus === 'loading' ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18} />}
                          <span>{currentState.generationStatus === 'loading' ? 'Generowanie...' : 'Wygeneruj post'}</span>
                        </button>
                        
                        <button 
                          onClick={() => {
                            updateCurrentProfile({ generationStatus: 'done', isManualMode: true });
                          }}
                          disabled={currentState.generationStatus === 'loading'}
                          className={`w-full sm:w-auto px-4 py-2 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-600 text-slate-200 border border-slate-700 hover:border-slate-600 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${currentState.isManualMode ? 'bg-slate-700 ring-2 ring-slate-500' : 'bg-slate-800'}`}
                        >
                          <Pen size={18} />
                          <span>Wpis ręczny</span>
                        </button>
                          
                        {currentState.generationStatus === 'done' && (
                          <button 
                            onClick={() => {
                              updateCurrentProfile({ generationStatus: 'idle' });
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-slate-900/50 hover:bg-slate-800 text-slate-500 hover:text-slate-300 border border-slate-800 hover:border-slate-700 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
                          >
                            <EyeOff size={18} />
                            <span>Ukryj</span>
                          </button>
                        )}
                      </div>
                   </div>

                 {/* Generation Results Section */}
                 {currentState.generationStatus === 'loading' && (
                   <div className="flex flex-col items-center justify-center py-12 gap-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                     <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                     <p className="text-slate-400 animate-pulse">Przygotowywanie treści dla {currentProfileData.name}...</p>
                   </div>
                 )}

                 {currentState.generationStatus === 'done' && (
                   <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                       <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 flex flex-col shadow-lg">
                          <div className="flex items-center gap-2 mb-3 md:mb-4 text-blue-400 font-semibold border-b border-slate-800 pb-2">
                            <FileText size={20} /><h3>TEKST DŁUGI {currentState.isManualMode ? '(Ręczny)' : '(AI)'}</h3>
                          </div>
                          <textarea 
                            value={currentState.isManualMode ? currentState.manualContent : currentState.content}
                            onChange={(e) => currentState.isManualMode ? updateCurrentProfile({ manualContent: e.target.value }) : updateCurrentProfile({ content: e.target.value })}
                            placeholder={currentState.isManualMode ? "Wpisz ręcznie tekst posta..." : "Wpisz tekst posta..."}
                            className="w-full flex-1 bg-slate-950/50 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 focus:outline-none resize-none text-sm leading-relaxed min-h-[250px]" 
                          />
                       </div>
                       <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 flex flex-col shadow-lg">
                          <div className="flex items-center gap-2 mb-3 md:mb-4 text-emerald-400 font-semibold border-b border-slate-800 pb-2">
                            <FileText size={20} /><h3>TEKST KRÓTKI {currentState.isManualMode ? '(Ręczny)' : '(AI)'}</h3>
                          </div>
                          <textarea 
                            value={currentState.isManualMode ? currentState.manualShortContent : currentState.shortContent}
                            onChange={(e) => currentState.isManualMode ? updateCurrentProfile({ manualShortContent: e.target.value }) : updateCurrentProfile({ shortContent: e.target.value })}
                            placeholder={currentState.isManualMode ? "Wpisz ręcznie krótki tekst..." : "Wpisz krótki tekst..."}
                            className="w-full flex-1 bg-slate-950/50 text-slate-200 p-3 rounded-lg border border-slate-800 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 focus:outline-none resize-none text-sm leading-relaxed min-h-[250px]" 
                          />
                       </div>
                       <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:p-5 flex flex-col shadow-lg">
                          <div className="flex items-center gap-2 mb-3 md:mb-4 text-purple-400 font-semibold border-b border-slate-800 pb-2">
                            <Image size={20} /><h3>ZDJĘCIE {currentState.isManualMode ? '(Ręczny)' : '(AI)'}</h3>
                          </div>
                          <div className="flex flex-col gap-3 h-full">
                            <input 
                              type="text" 
                              value={currentState.isManualMode ? currentState.manualImageUrl : currentState.imageUrl}
                              onChange={(e) => currentState.isManualMode ? updateCurrentProfile({ manualImageUrl: e.target.value }) : updateCurrentProfile({ imageUrl: e.target.value })}
                              placeholder="Wklej URL zdjęcia..."
                              className="w-full bg-slate-950/50 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-purple-500/50"
                            />
                            <div className="flex-1 bg-slate-950/50 rounded-lg flex items-center justify-center overflow-hidden border border-slate-800 min-h-[200px] relative group">
                              {(currentState.isManualMode ? currentState.manualImageUrl : currentState.imageUrl) ? (
                                <>
                                  <img src={currentState.isManualMode ? currentState.manualImageUrl : currentState.imageUrl} alt="Post content" className="max-w-full max-h-full object-contain" />
                                  <button 
                                    onClick={() => currentState.isManualMode ? updateCurrentProfile({ manualImageUrl: '' }) : updateCurrentProfile({ imageUrl: '' })}
                                    className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                    title="Usuń zdjęcie"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <div className="text-slate-600 flex flex-col items-center gap-2">
                                  <Image size={32} className="opacity-50" />
                                  <span className="text-xs">Wklej URL powyżej, aby dodać zdjęcie</span>
                                </div>
                              )}
                            </div>
                          </div>
                       </div>
                     </div>

                     {!currentState.isManualMode && (
                       <div className="flex justify-center">
                          <button 
                            onClick={handleGenerateContent}
                            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 hover:border-slate-600 rounded-xl transition-all shadow-md"
                          >
                            <RefreshCcw size={18} />
                            <span>Wygeneruj nowy post</span>
                          </button>
                       </div>
                     )}

                     <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 md:p-6 flex flex-col items-end justify-center shadow-2xl gap-4">
                        
                        <button
                          onClick={handleSend}
                          disabled={status === 'loading'}
                          className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-bold transition-all w-full md:w-full h-full text-lg ${
                            status === 'loading' 
                              ? 'bg-slate-700 text-slate-400 cursor-wait'
                              : status === 'success'
                              ? 'bg-green-600 text-white shadow-lg shadow-green-900/30'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-900/40 hover:scale-105 active:scale-95'
                          }`}
                        >
                          {status === 'loading' ? 'Wysyłanie...' : status === 'success' ? 'Wysłano!' : (
                            <>
                              <Send size={24} />
                              <span className="inline">Opublikuj teraz na {currentProfileData.name}</span>
                            </>
                          )}
                        </button>
                     </div>
                   </div>
                 )}
               </div>
             )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;
