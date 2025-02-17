import React from "react";
import { Clock } from "./Clock";

interface HeaderProps {
  isLocalNetwork: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isLocalNetwork }) => {
  const title = import.meta.env.VITE_APP_TITLE ?? "Dashboard";

  return (
    <header className="bg-base-300 shadow-lg rounded-lg px-8 py-4">
      <div className="flex justify-between items-center">
        {/* Левая часть */}
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 tooltip tooltip-bottom flex-shrink-0"
            data-tip={isLocalNetwork ? "Локальная сеть" : "Внешняя сеть"}
          >
            <img
              src="/favicon.svg"
              alt="Usov Home"
              className={` rounded-lg border-2 ${
                isLocalNetwork ? " border-secondary/30" : "border-primary/30"
              }`}
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-primary">{title}</h1>
          </div>
        </div>

        {/* Правая часть */}
        <div className="flex items-center gap-6">
          <Clock />
        </div>
      </div>
    </header>
  );
};
