interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
      <button
        className={`btn min-w-[100px] ${
          !selectedCategory ? "btn-primary" : "btn-ghost"
        }`}
        onClick={() => onCategorySelect(null)}
      >
        Все
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`btn min-w-[100px] ${
            selectedCategory === category ? "btn-primary" : "btn-ghost"
          }`}
          onClick={() => onCategorySelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
