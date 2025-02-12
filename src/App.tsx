import { useState } from "react";
import { Link } from "./types";
import { LinkCard } from "./components/LinkCard";
import linksData from "../data/links.json";
import { IconCacheProvider } from "./contexts/IconCache";
import { useIsLocalNetwork } from "./hooks/useIsLocalNetwork";
import { Preloader } from "./components/Preloader";

function App() {
  const [links] = useState<Link[]>(linksData.links);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isLocalNetwork = useIsLocalNetwork();

  const categories = Array.from(
    new Set(
      links
        .map((link) => link.category)
        .filter((category): category is string => !!category)
    )
  );

  const filteredLinks = links.filter((link) => {
    // Фильтруем секретные ссылки для внешней сети
    if (link.isSecret && !isLocalNetwork) {
      return false;
    }

    const matchesSearch =
      searchQuery.toLowerCase().trim() === "" ||
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (link.category &&
        link.category.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      !selectedCategory || link.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <IconCacheProvider>
      <div className="min-h-screen bg-base-200 p-8">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center flex items-center justify-center gap-4">
            <img src="/vite.svg" alt="Usov Home" className="w-12 h-12" />
            Usov Home
            {isLocalNetwork && <span className="badge badge-secondary">Local Network</span>}
          </h1>

          {/* Поиск */}
          <div className="flex justify-center mb-6">
            <input
              type="search"
              placeholder="Поиск по названию, ссылке или категории..."
              className="input w-full max-w-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Фильтр по категориям */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button
              className={`btn min-w-[100px] ${
                !selectedCategory ? "btn-primary" : "btn-ghost"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              Все
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`btn min-w-[100px] ${
                  selectedCategory === category ? "btn-primary" : "btn-ghost"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Сетка ссылок */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-fr">
            {filteredLinks.map((link) => (
              <LinkCard key={link.id} link={link} />
            ))}
          </div>
        </div>
      </div>
    </IconCacheProvider>
  );
}

export default function Root() {
  return (
    <Preloader>
      <App />
    </Preloader>
  );
}
