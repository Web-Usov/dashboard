interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function SearchBar({ searchQuery, onSearchChange }: SearchBarProps) {
  return (
    <div className="flex justify-center mb-6  ">
      <input
        type="search"
        placeholder="Поиск по названию, ссылке или категории..."
        className="input w-full max-w-lg"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </div>
  );
}
