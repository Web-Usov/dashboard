import { useState } from "react";
import { Link } from "./types";
import { LinkCard } from "./components/LinkCard";
import { SearchBar } from "./components/SearchBar";
import { CategoryFilter } from "./components/CategoryFilter";
import { Header } from "./components/Header";
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

  const filteredLinks = links
    .filter((link) => {
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
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  return (
    <IconCacheProvider>
      <div className="min-h-screen bg-base-200">
        <Header isLocalNetwork={isLocalNetwork} />
        <div className="flex flex-col mx-auto p-8">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
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
