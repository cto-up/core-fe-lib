"use client";

/**
 * React Context store for AAL2 verification
 * Uses framework-agnostic Aal2Manager with a React state adapter.
 *
 * SELF-INITIALIZING: Initializes the AAL2 flow directly on trigger,
 * without depending on component mounting.
 */

import React, {
    createContext,
    useContext,
    useState,
    useMemo,
    useCallback,
    useRef,
} from "react";
import {
    Aal2Manager,
    type Aal2VerificationState,
    type IStateStore,
} from "../core/aal2-manager";

interface Aal2ContextType {
    state: Aal2VerificationState;
    triggerVerification: () => Promise<boolean>;
    resolveVerification: (success: boolean) => void;
    updateState: (updates: Partial<Aal2VerificationState>) => void;
    resetState: () => void;
    manager: Aal2Manager;
}

const Aal2Context = createContext<Aal2ContextType | undefined>(undefined);

export function Aal2Provider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<Aal2VerificationState>({
        show: false,
        flowId: null,
        csrfToken: "",
        availableMethods: [],
        selectedMethod: null,
        totpCode: "",
        lookupCode: "",
        error: "",
        loading: false,
    });

    // Use ref to always get latest state without causing re-renders
    const stateRef = useRef(state);
    stateRef.current = state;

    // React state adapter — implements IStateStore interface
    const stateAdapter: IStateStore<Aal2VerificationState> = useMemo(
        () => ({
            getState: () => stateRef.current,
            setState: (updates) => {
                setState((prev) => ({ ...prev, ...updates }));
            },
        }),
        [],
    );

    const manager = useMemo(
        () => new Aal2Manager(stateAdapter),
        [stateAdapter],
    );

    /**
     * Trigger verification with automatic initialization.
     * Called by the axios interceptor when AAL2 is required.
     */
    const triggerVerification = useCallback(async (): Promise<boolean> => {
        const promise = manager.triggerVerification();

        try {
            const { MfaService } = await import("@/lib/openapi/core");
            await manager.initializeFlow(() => MfaService.getMfaStatus());
        } catch (error) {
            console.error("Failed to initialize AAL2 flow:", error);
            manager.resolveVerification(false);
        }

        return promise;
    }, [manager]);

    const resolveVerification = useCallback(
        (success: boolean) => {
            manager.resolveVerification(success);
        },
        [manager],
    );

    const updateState = useCallback(
        (updates: Partial<Aal2VerificationState>) => {
            setState((prev) => ({ ...prev, ...updates }));
        },
        [],
    );

    const resetState = useCallback(() => {
        manager.reset();
    }, [manager]);

    const value = useMemo(
        () => ({
            state,
            triggerVerification,
            resolveVerification,
            updateState,
            resetState,
            manager,
        }),
        [
            state,
            triggerVerification,
            resolveVerification,
            updateState,
            resetState,
            manager,
        ],
    );

    return (
        <Aal2Context.Provider value={value}>{children}</Aal2Context.Provider>
    );
}

export function useAal2Store() {
    const context = useContext(Aal2Context);
    if (context === undefined) {
        throw new Error("useAal2Store must be used within Aal2Provider");
    }
    return context;
}
