
import React from 'react';
import { FileText, Zap, Image as ImageIcon, Scissors, Layers } from 'lucide-react';
import { AppView } from '../types';

interface HeaderProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'IMAGE_TO_PDF' as AppView, label: 'IMG to PDF', icon: ImageIcon },
    { id: 'PDF_TO_IMAGE' as AppView, label: 'PDF to IMG', icon: ImageIcon },
    { id: 'PDF_SPLIT' as AppView, label: 'Split PDF', icon: Scissors },
    { id: 'PDF_MERGE' as AppView, label: 'Merge PDF', icon: Layers },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('IMAGE_TO_PDF')}>
          <div className="bg-indigo-600 p-2 rounded-lg">
            <FileText className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600 hidden sm:block">
            SnapPDF
          </span>
        </div>
        
        <nav className="flex items-center bg-gray-100/50 p-1 rounded-xl">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === item.id
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
           <div className="hidden sm:flex items-center text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full uppercase tracking-wider">
             <Zap className="w-3 h-3 mr-1 fill-amber-500" />
             AI Engine v3
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
