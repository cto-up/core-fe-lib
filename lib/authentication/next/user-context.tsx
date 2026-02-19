"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { KratosSession } from "../core/kratos-service";
import type { LoggedUser } from "@/lib/models/logged-user";

interface UserContextType {
    session: KratosSession | null;
    user: LoggedUser | null;
    isLoading: boolean;
    setSession: (session: KratosSession | null) => void;
    setUser: (user: LoggedUser | null) => void;
    setIsLoading: (loading: boolean) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function KratosUserProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [session, setSession] = useState<KratosSession | null>(null);
    const [user, setUser] = useState<LoggedUser | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <UserContext.Provider
            value={{
                session,
                user,
                isLoading,
                setSession,
                setUser,
                setIsLoading,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useKratosUserStore() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error(
            "useKratosUserStore must be used within KratosUserProvider",
        );
    }
    return context;
}
