import React from 'react';
import { Search, X } from 'lucide-react';
import '../styles/SearchBar.css';

function SearchBar({
  value,
  onChange,
  placeholder = 'Search tickets by number, customer, or subject...'
}) {
  return (
    <div className="search-bar-box">
      <span className="search-bar-icon">
        <Search size={16} />
      </span>
      <input
        type="text"
        className="search-bar-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="search-bar-clear"
          onClick={() => onChange('')}
          aria-label="Clear search text"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
