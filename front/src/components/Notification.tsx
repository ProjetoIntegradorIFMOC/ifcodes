import { useEffect, useRef, useState } from "react";

type NotificationProps = {
    message: string;
    type?: "success" | "error" | "warning";
    onClose?: () => void;
    duration?: number; // em ms
};

const typeStyles = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500 text-black",
};

const progressStyles = {
    success: "bg-green-300",
    error: "bg-red-300",
    warning: "bg-yellow-300",
};

export default function Notification({
    message,
    type = "error",
    onClose,
    duration = 5000,
}: NotificationProps) {
    const [progress, setProgress] = useState(100);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!onClose) return;
        const start = Date.now();
        intervalRef.current = setInterval(() => {
            const elapsed = Date.now() - start;
            const percent = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(percent);
            if (elapsed >= duration) {
                onClose();
            }
        }, 100);
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [onClose, duration]);

    return (
        <div
            className={`fixed bottom-6 right-6 ${typeStyles[type]} px-6 py-3 rounded shadow-lg flex flex-col items-center gap-2 z-[100] w-[350px]`}
        >
            {onClose && (
                <button
                    className="absolute top-2 right-2 text-white hover:bg-opacity-80 rounded-full p-1 transition-colors cursor-pointer"
                    onClick={onClose}
                    aria-label="Fechar"
                >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="white" opacity="0.15"/>
                        <path d="M6 6L14 14M14 6L6 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                </button>
            )}
            <span className="text-white">{message}</span>
            <div className={`w-full h-2 ${progressStyles[type]} rounded mt-2 overflow-hidden`}>
                <div
                    className="h-full bg-white transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}