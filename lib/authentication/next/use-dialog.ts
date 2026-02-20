"use client";

import { useState, useCallback } from "react";

interface DialogOptions {
    title: string;
    message: string;
    ok: string;
    cancel: string;
}

export function useDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<DialogOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<
        ((confirmed: boolean) => void) | null
    >(null);

    const confirm = useCallback((opts: DialogOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(opts);
            setIsOpen(true);
            setResolvePromise(() => resolve);
        });
    }, []);

    const handleConfirm = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(true);
            setIsOpen(false);
            setResolvePromise(null);
            setOptions(null);
        }
    }, [resolvePromise]);

    const handleCancel = useCallback(() => {
        if (resolvePromise) {
            resolvePromise(false);
            setIsOpen(false);
            setResolvePromise(null);
            setOptions(null);
        }
    }, [resolvePromise]);

    return {
        isOpen,
        options,
        confirm,
        handleConfirm,
        handleCancel,
    };
}
