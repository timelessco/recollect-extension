export interface AuthenticatedState {
	isAuthenticated: true;
	userId: string;
	expiresAt: Date;
}

export type UnauthenticatedReason =
	| "no_cookies"
	| "expired"
	| "invalid"
	| "error";

export interface UnauthenticatedState {
	isAuthenticated: false;
	reason: UnauthenticatedReason;
}

export type AuthState = AuthenticatedState | UnauthenticatedState;
