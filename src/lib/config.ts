export const config = {
	isDev: import.meta.env.DEV,
	isProd: import.meta.env.PROD,
	recollectDomain: import.meta.env.VITE_RECOLLECT_DOMAIN,
	recollectUrl: import.meta.env.VITE_RECOLLECT_URL,
} as const;
