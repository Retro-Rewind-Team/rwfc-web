import { createSignal, createEffect, For } from "solid-js";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

// Global toast state
const [toasts, setToasts] = createSignal<Toast[]>([]);

// Toast utilities
export const toast = {
  success: (message: string, duration = 3000) =>
    showToast({ message, type: "success", duration }),
  error: (message: string, duration = 5000) =>
    showToast({ message, type: "error", duration }),
  info: (message: string, duration = 3000) =>
    showToast({ message, type: "info", duration }),
  warning: (message: string, duration = 4000) =>
    showToast({ message, type: "warning", duration }),
};

function showToast(options: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substring(2);
  const newToast: Toast = { id, ...options };

  setToasts((prev) => [...prev, newToast]);

  if (options.duration && options.duration > 0) {
    setTimeout(() => {
      removeToast(id);
    }, options.duration);
  }
}

function removeToast(id: string) {
  setToasts((prev) => prev.filter((toast) => toast.id !== id));
}

// Toast component
export function Toaster() {
  return (
    <div class="fixed bottom-4 right-4 z-50 space-y-2">
      <For each={toasts()}>
        {(toast) => (
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        )}
      </For>
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
  onRemove: () => void;
}

function ToastItem(props: Readonly<ToastItemProps>) {
  const [isVisible, setIsVisible] = createSignal(false);

  createEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  });

  const getToastStyles = () => {
    const baseClasses =
      "px-4 py-3 rounded-lg shadow-lg border transform transition-all duration-300 max-w-sm";
    const typeClasses = {
      success: "bg-green-50 border-green-200 text-green-800",
      error: "bg-red-50 border-red-200 text-red-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    };

    const animationClasses = isVisible()
      ? "translate-x-0 opacity-100"
      : "translate-x-full opacity-0";

    return `${baseClasses} ${typeClasses[props.toast.type]} ${animationClasses}`;
  };

  const getIcon = () => {
    switch (props.toast.type) {
      case "success":
        return (
          <svg
            class="w-5 h-5 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            class="w-5 h-5 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "info":
        return (
          <svg
            class="w-5 h-5 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            class="w-5 h-5 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
    }
  };

  return (
    <div class={getToastStyles()}>
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">{getIcon()}</div>
        <div class="flex-1 text-sm font-medium">{props.toast.message}</div>
        <button
          onClick={props.onRemove}
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
