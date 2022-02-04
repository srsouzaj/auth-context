export class AuthTokenError extends Error {
    constructor() {
        super("Error With Authentication Token")
    }
}