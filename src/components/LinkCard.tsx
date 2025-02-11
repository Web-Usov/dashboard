import { Link } from "../types";
import { useState, useEffect } from "react";
import { useIconCache } from "../contexts/IconCache";

interface LinkCardProps {
  link: Link;
}

export function LinkCard({ link }: LinkCardProps) {
  const [iconError, setIconError] = useState(false);
  const domain = new URL(link.url).hostname;
  const { getIconPath, setIconPath } = useIconCache();

  const defaultIconPaths = [
    `https://${domain}/favicon.ico`,
    `https://${domain}/favicon.png`,
    `https://${domain}/static/favicon.ico`,
    `https://${domain}/static/icons/favicon.ico`,
  ];

  const iconPaths = link.icon
    ? [link.icon, ...defaultIconPaths]
    : defaultIconPaths;

  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [currentIconUrl, setCurrentIconUrl] = useState<string>("");

  useEffect(() => {
    const cachedPath = getIconPath(domain);
    if (cachedPath) {
      setCurrentIconUrl(cachedPath);
    } else {
      setCurrentIconUrl(iconPaths[0]);
    }
  }, [domain, getIconPath, link.icon]);

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
    if (!getIconPath(domain)) {
      setIconPath(domain, currentIconUrl);
    }
  };

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card h-full w-full bg-base-100 shadow-xl hover:shadow-2xl transition-shadow"
    >
      <div className="card-body">
        <div className="flex items-center justify-between gap-2">
          <h2 className="card-title truncate">
            {!iconError ? (
              <img
                src={currentIconUrl}
                alt=""
                className="w-8 h-8 flex-shrink-0"
                onError={handleIconError}
                onLoad={handleIconLoad}
              />
            ) : (
              <span className="material-icons w-8 h-8 flex-shrink-0 flex items-center justify-center">
                web
              </span>
            )}
            <span className="truncate">{link.title}</span>
          </h2>
          {link.category && (
            <div className="badge badge-secondary text-xs whitespace-nowrap">
              {link.category}
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 truncate">{domain}</p>
      </div>
    </a>
  );
}
