"use client";

import React, { createContext, useContext, useState } from "react";

interface Tenant {
    tenant_id: string;
    allow_sign_up?: boolean;
    subdomain?: string;
    tenant_name?: string;
}

interface TenantContextType {
    tenant: Tenant | null;
    setTenant: (tenant: Tenant | null) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: React.ReactNode }) {
    const [tenant, setTenant] = useState<Tenant | null>(null);

    return (
        <TenantContext.Provider value={{ tenant, setTenant }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenantStore() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error("useTenantStore must be used within TenantProvider");
    }
    return context;
}
