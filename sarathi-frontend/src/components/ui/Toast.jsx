import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

// ── Toast Context ──────────────────────────────────────────────────────────
const ToastContext = createContext();

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
        return id;
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
        </ToastContext.Provider>
    );
}

// ── Toast Container ────────────────────────────────────────────────────────
function ToastContainer({ toasts, onDismiss }) {
    return (
        <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 max-w-sm">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onDismiss={() => onDismiss(toast.id)} />
            ))}
        </div>
    );
}

// ── Single Toast ───────────────────────────────────────────────────────────
const typeConfig = {
    success: {
        bg: 'bg-success-light',
        border: 'border-l-4 border-success',
        Icon: CheckCircle,
        iconColor: 'text-success',
    },
    error: {
        bg: 'bg-danger-light',
        border: 'border-l-4 border-danger',
        Icon: XCircle,
        iconColor: 'text-danger',
    },
    info: {
        bg: 'bg-info-light',
        border: 'border-l-4 border-info',
        Icon: Info,
        iconColor: 'text-info',
    },
};

function Toast({ message, type = 'info', onDismiss }) {
    const [show, setShow] = useState(false);
    const config = typeConfig[type] || typeConfig.info;
    const Icon = config.Icon;

    useEffect(() => {
        requestAnimationFrame(() => setShow(true));
    }, []);

    return (
        <div
            className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-md ${config.bg} ${config.border} transition-transform duration-300 ease-out ${show ? 'translate-x-0 opacity-100' : 'translate-x-[120%] opacity-0'
                }`}
        >
            <Icon size={18} className={`mt-0.5 shrink-0 ${config.iconColor}`} />
            <p className="font-body text-sm text-gray-900 flex-1">{message}</p>
            <button
                onClick={onDismiss}
                className="shrink-0 text-gray-500 hover:text-gray-700 transition-colors"
                aria-label="Close"
            >
                <X size={16} />
            </button>
        </div>
    );
}

export default Toast;
