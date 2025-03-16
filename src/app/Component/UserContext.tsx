"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    phone: string;
}

interface UserContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    isLoading: boolean;
    logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://ecommercepeachflask-git-main-husnain-alis-projects-dbd16c4d.vercel.app";

    // Check authentication status on initial load
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch(`${API_URL}/api/auth/me`, {
                    method: "GET",
                    credentials: "include",
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData.data);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Logout function
    const logout = async () => {
        try {
            await fetch(`${API_URL}/api/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
            setUser(null);
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <UserContext.Provider value={{ user, setUser, isLoading, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};