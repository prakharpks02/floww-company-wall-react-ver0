import React from 'react';
import { 
  Users, 
  Star, 
  MessageCircle,
  Plus
} from 'lucide-react';

const DesktopAppSidebar = ({
  showGroupFilter,
  setShowGroupFilter,
  showFavouritesFilter,
  setShowFavouritesFilter,
  onCreateGroup
}) => {
  return (
    <div className="w-16 h-full bg-white/70 backdrop-blur-xl border-r border-white/20 flex flex-col shadow-[inset_0_0_20px_rgba(255,255,255,0.8),0_8px_32px_rgba(109,40,217,0.1)] rounded-l-3xl">
      <div className="p-3 border-b border-white/30">
        <div className="flex flex-col items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-[#6d28d9] to-[#7c3aed] rounded-2xl shadow-[0_8px_32px_rgba(109,40,217,0.3)] flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
        </div>
        
        <nav className="space-y-2">
          <button 
            onClick={onCreateGroup}
            className="relative w-full flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:scale-105 group text-[#6b7280] hover:bg-gradient-to-r hover:from-[#6d28d9] hover:to-[#7c3aed] hover:text-white hover:shadow-[0_4px_16px_rgba(109,40,217,0.3)]"
            title="Create Group"
          >
            <Plus className="h-5 w-5" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Create Group
            </div>
          </button>
          
          <button 
            onClick={() => setShowGroupFilter(!showGroupFilter)}
            className={`relative w-full flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:scale-105 group ${
              showGroupFilter 
                ? 'bg-gradient-to-r from-[#6d28d9] to-[#7c3aed] text-white shadow-[0_4px_16px_rgba(109,40,217,0.3)]' 
                : 'text-[#6b7280] hover:bg-white/40 hover:text-[#1f2937] hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.5)]'
            }`}
          >
            <Users className="h-4 w-4" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {showGroupFilter ? 'Show All' : 'Groups Only'}
            </div>
          </button>
          
          <button 
            onClick={() => setShowFavouritesFilter(!showFavouritesFilter)}
            className={`relative w-full flex items-center justify-center p-2 rounded-xl transition-all duration-300 hover:scale-105 group ${
              showFavouritesFilter 
                ? 'bg-gradient-to-r from-[#f59e0b] to-[#f97316] text-white shadow-[0_4px_16px_rgba(245,158,11,0.3)]' 
                : 'text-[#6b7280] hover:bg-white/40 hover:text-[#1f2937] hover:shadow-[inset_0_0_15px_rgba(255,255,255,0.5)]'
            }`}
          >
            <Star className="h-4 w-4" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-black/75 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              {showFavouritesFilter ? 'Show All' : 'Favourites Only'}
            </div>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default DesktopAppSidebar;
