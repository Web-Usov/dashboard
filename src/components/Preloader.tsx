import { useState, useEffect } from "react";
import { checkIsLocalNetwork } from "../hooks/useIsLocalNetwork";

interface PreloaderProps {
  children: React.ReactNode;
}

interface PreloadTask {
  name: string;
  task: () => Promise<void>;
  weight: number; // Вес задачи в общем прогрессе (1-100)
}

export function Preloader({ children }: PreloaderProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState("");

  useEffect(() => {
    const MINIMUM_DISPLAY_TIME = 1000; // Минимальное время отображения прелоадера
    const FADE_DURATION = 500; // Длительность затухания

    const startTime = Date.now();
    let totalWeight = 0;
    let completedWeight = 0;

    const tasks: PreloadTask[] = [
      {
        name: "Проверка сети...",
        weight: 40,
        task: async () => {
          const isLocal = await checkIsLocalNetwork();
          window.__IS_LOCAL_NETWORK__ = isLocal;
        },
      },
      // Здесь можно добавить другие задачи
      {
        name: "Подготовка интерфейса...",
        weight: 60,
        task: async () => {
          // Имитация загрузки ресурсов
          await new Promise((resolve) => setTimeout(resolve, 200));
        },
      },
    ];

    // Вычисляем общий вес
    totalWeight = tasks.reduce((sum, task) => sum + task.weight, 0);

    const updateProgress = (completedTasks: number) => {
      setProgress(Math.round((completedTasks / totalWeight) * 100));
    };

    const runTasks = async () => {
      for (const { name, task, weight } of tasks) {
        setCurrentTask(name);
        await task();
        completedWeight += weight;
        updateProgress(completedWeight);
      }

      // Проверяем, прошло ли минимальное время
      const elapsed = Date.now() - startTime;
      if (elapsed < MINIMUM_DISPLAY_TIME) {
        await new Promise((resolve) =>
          setTimeout(resolve, MINIMUM_DISPLAY_TIME - elapsed)
        );
      }

      // Плавно скрываем прелоадер
      setIsVisible(false);
      await new Promise((resolve) => setTimeout(resolve, FADE_DURATION));
    };

    runTasks();
  }, []);

  if (!isVisible) {
    return children;
  }

  return (
    <div
      className={`fixed inset-0 bg-base-200 flex flex-col items-center justify-center gap-6 transition-opacity duration-500 ${
        progress === 100 ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Логотип */}
      <div className="w-24 h-24 relative">
        <img
          src="/favicon.svg"
          alt="Logo"
          className="w-full h-full animate-pulse"
        />
      </div>

      {/* Прогресс */}
      <div className="w-64 flex flex-col gap-2">
        <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary h-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-sm text-base-content/60 text-center">
          {currentTask}
        </div>
      </div>
    </div>
  );
}
