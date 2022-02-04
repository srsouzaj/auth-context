import { createContext, ReactNode, useEffect, useState } from "react";
import Router from 'next/router';

import { setCookie, parseCookies, destroyCookie } from 'nookies';
import { api } from "../services/apiClient";

type SingInCredentials = {
    email: string;
    password: string;
}

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type AuthContextData = {
    signIn: (credentials: SingInCredentials) => Promise<void>;
    signOut: () => void;
    user: User;
    isAuthenticated: boolean;
};

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

let authChannel: BroadcastChannel;

export function signOut() {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refreshToken')
    authChannel.postMessage("signOut");
    Router.push('/')

}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth');
        authChannel.onmessage = (message) => {
            switch (message.data) {
                case 'signOut':
                    signOut();
                    authChannel.close();
                    break;

                // case "signIn":
                //     window.location.replace("http://localhost:3000/dashboard");
                //     break;
                default:
                    break;
            }
        }
    }, [])

    useEffect(() => {
        const { 'nextauth.token': token } = parseCookies()

        if (token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data;

                setUser({ email, permissions, roles })
            })
                .catch(error => {
                    signOut()


                })
        }
    }, [])

    async function signIn({ email, password }: SingInCredentials) {
        try {
            const response = await api.post('sessions', {
                email, password,
            })

            const { token, refreshToken, permissions, roles } = response.data;

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, //30days
                path: '/'
            })

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, //30days
                path: '/'
            })

            setUser({
                email,
                permissions,
                roles,
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`;
            Router.push('/dashboard')
            //authChannel.postMessage("signIn");


        }
        catch (err) {
            console.log(err)
        }
    }

    return (
        <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user, }}>{children}</AuthContext.Provider>
    )
}