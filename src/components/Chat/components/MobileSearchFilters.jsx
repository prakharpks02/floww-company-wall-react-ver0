import React from 'react';
import { Search, Users, Star } from 'lucide-react';

const MobileSearchFilters = ({
  searchQuery,
  setSearchQuery,
  showGroupFilter,
  setShowGroupFilter,
  showFavouritesFilter,
  setShowFavouritesFilter
}) => {
  return (
    <div className="p-4 bg-white border-b border-gray-200 space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
         placeholder="Start a new chat or search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base transition-all duration-200"
        />
      </div>
      
      {/* Filter buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowGroupFilter(!showGroupFilter)}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            showGroupFilter 
              ? 'bg-purple-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="h-4 w-4 flex-shrink-0" />
          <span>{showGroupFilter ? 'Groups Only' : 'Groups'}</span>
        </button>
        
        <button
          onClick={() => setShowFavouritesFilter(!showFavouritesFilter)}
          className={`flex-1 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            showFavouritesFilter 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Star className="h-4 w-4 flex-shrink-0" />
          <span>{showFavouritesFilter ? 'Favorites Only' : 'Favorites'}</span>
        </button>
      </div>
    </div>
  );
};

export default MobileSearchFilters;
