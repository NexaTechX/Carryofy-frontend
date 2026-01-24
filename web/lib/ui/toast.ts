import toast, { ToastOptions } from 'react-hot-toast';

type ToastKind = 'success' | 'error' | 'loading';

export const showSuccessToast = (message: string, options?: ToastOptions) =>
  dispatchToast('success', message, options);

export const showErrorToast = (message: string, options?: ToastOptions) =>
  dispatchToast('error', message, options);

export const showLoadingToast = (message: string, options?: ToastOptions) =>
  dispatchToast('loading', message, options);

const dispatchToast = (kind: ToastKind, message: string, options?: ToastOptions) => {
  const id = options?.id ?? undefined;
  switch (kind) {
    case 'success':
      return toast.success(message, { id, duration: 2500, ...options });
    case 'error':
      return toast.error(message, { id, duration: 3500, ...options });
    case 'loading':
      return toast.loading(message, { id, ...options });
    default:
      return toast(message, options);
  }
};
