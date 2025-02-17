import { Link } from "../types";
import { useState, useEffect } from "react";
import { useCachedState } from "../utils";

interface LinkCardProps {
  link: Link;
}

export function LinkCard({ link }: LinkCardProps) {
  const [iconError, setIconError] = useState(false);
  const domain = new URL(link.url).hostname;
  // const { getIconPath, setIconPath } = useIconCache();

  const [iconPath, setIconPath] = useCachedState<string | undefined>(
    `icon-${domain}`,
    undefined
  );

  const defaultIconPaths = [
    `https://${domain}/favicon.ico`,
    `https://${domain}/favicon.png`,
    `https://${domain}/favicon.svg`,
    `https://${domain}/static/favicon.ico`,
    `https://${domain}/static/icons/favicon.ico`,
  ];

  const iconPaths: string[] = link.icon
    ? Array.from(new Set([link.icon, ...defaultIconPaths]))
    : Array.from(new Set(defaultIconPaths));

  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [currentIconUrl, setCurrentIconUrl] = useState<string>(
    iconPath ?? iconPaths[0]
  );

  useEffect(() => {
    if (iconPath) {
      setCurrentIconUrl(iconPath);
    } else {
      setCurrentIconUrl(iconPaths[0]);
    }
  }, [domain, iconPath, link.icon]);

  const handleIconError = () => {
    if (currentIconUrl !== iconPaths[iconPaths.length - 1]) {
      const nextIndex = currentIconIndex + 1;
      if (nextIndex < iconPaths.length) {
        setCurrentIconIndex(nextIndex);
        setCurrentIconUrl(iconPaths[nextIndex]);
      } else {
        setIconError(true);
      }
    } else {
      setIconError(true);
    }
  };

  const handleIconLoad = () => {
    setIconError(false);
    if (iconPath !== currentIconUrl) {
      setIconPath(currentIconUrl);
    }
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`card bg-base-200 shadow-xl transition-all hover:scale-105 hover:shadow-2xl relative border ${
        link.isSecret ? "border-error/30" : "border-primary/30"
      }`}
    >
      {link.isSecret && (
        <div
          className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
            link.isSecret ? "bg-error/50" : "bg-primary/50"
          }`}
          title={link.isSecret ? "Приватный ресурс" : "Публичный ресурс"}
        />
      )}
      <div className="card-body">
        <div className="flex items-center gap-2">
          <div className="flex-shrink-0 h-8 w-8">
            {!iconError ? (
              <img
                src={currentIconUrl}
                className="h-8 w-8"
                onError={handleIconError}
                onLoad={handleIconLoad}
              />
            ) : (
              <span className="material-icons w-8 h-8 flex-shrink-0 flex items-center justify-center">
                web
              </span>
            )}
          </div>
          <h2 className="card-title flex-1">{link.title}</h2>
          <div className="flex items-center gap-2">
            {link.category && (
              <div className="badge badge-secondary text-xs whitespace-nowrap">
                {link.category}
              </div>
            )}
          </div>
        </div>
        <p className="text-sm text-base-content/70">{domain}</p>
      </div>
    </a>
  );
}
