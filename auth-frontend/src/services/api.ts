import { parseCookies, setCookie } from 'nookies';
import axios, { AxiosError } from 'axios';
import { SignOut } from '../contexts/AuthContext';
import { AuthTokenError } from '../error/AuthTokenError';


let isRefreshing = false;
let failedRequestsQueue = [];

export function setupAPIClient(ctx = undefined) {
    let cookies = parseCookies(ctx);
    const api = axios.create({
        baseURL: "http://localhost:3333",
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    });

    api.interceptors.response.use(response => {
        return response;
    }, (error: AxiosError) => {
        if (error.response.status === 401) {
            if (error.response.data?.code === 'token.expired') {
                //Renovando o token.
                cookies = parseCookies(ctx);

                const { 'nextauth.refreshToken': refreshToken } = cookies;
                const originalConfig = error.config;

                if (!isRefreshing) {
                    isRefreshing = true;

                    api.post('/refresh', {
                        refreshToken
                    }).then(response => {
                        const { token } = response.data;

                        setCookie(ctx, 'nextauth.token', token, {
                            maxAge: 60 * 60 * 24 * 30, //30 dias
                            path: '/'
                        });

                        setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
                            maxAge: 60 * 60 * 24 * 30, //30 dias
                            path: '/'
                        });

                        api.defaults.headers['Authorization'] = `Bearer ${token}`;
                        failedRequestsQueue.forEach(request => request.resolve(token));
                        failedRequestsQueue = [];
                    }).catch(error => {
                        failedRequestsQueue.forEach(request => request.reject(error))
                        failedRequestsQueue = [];

                        if (process.browser) {
                            SignOut();
                        }
                        else {
                            return Promise.reject(new AuthTokenError())
                        }
                    }).finally(() => {
                        isRefreshing = false;
                    });
                }

                return new Promise((resolve, reject) => {
                    failedRequestsQueue.push({
                        resolve: (token: string) => {
                            originalConfig.headers['Authorization'] = `Bearer ${token}`;
                            resolve(api(originalConfig));
                        },

                        reject: (err: AxiosError) => {
                            reject(err);
                        }
                    })
                })
            } else {
                if (process.browser) {
                    SignOut(
                        
                    );
                }
            }
        }
        return Promise.reject(error);
    });

    return api;
}