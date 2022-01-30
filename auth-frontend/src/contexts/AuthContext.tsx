import { createContext, ReactNode } from "react";
import { api } from "../services/api";

type SingInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn(credentials: SingInCredentials): Promise<void>;
    isAuthenticated: boolean;
};

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: AuthProviderProps) {
    const isAuthenticated = false;

    async function signIn({ email, password }: SingInCredentials) {
        try {
            const response = await api.post('sessions', {
                email, password,
            })

            console.log(response.data)
        }
        catch (err) {
            console.log(err)
        }
    }

    return (
        <AuthContext.Provider value={{ signIn, isAuthenticated }}>{children}</AuthContext.Provider>
    )
}