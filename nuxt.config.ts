// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2024-04-03",
	devtools: { enabled: true },

	// APP 

	app: {
	head: {
	  title: 'MyManhuaList',
	  link: [
		{ rel: 'icon', type: 'image/x-icon', href: '/icons/favicon.ico' },
	  ],
	},
  },

	// Modules
	modules: ["@nuxtjs/tailwindcss", "@nuxtjs/i18n", "@nuxtjs/color-mode"],

	// Configuration des composants et imports automatiques
	components: true,
	imports: {
		autoImport: true,
	},

	// Configuration i18n
	i18n: {
		locales: [
			{
				code: "fr",
				name: "Français",
				file: "fr.json",
			},
			{
				code: "en",
				name: "English",
				file: "en.json",
			},
		],
		langDir: "locales",
		defaultLocale: "fr",
		strategy: "no_prefix",
		detectBrowserLanguage: {
			useCookie: true,
			cookieKey: "i18n_redirected",
			redirectOn: "root",
		},
	},

	// Configuration color-mode (dark/light)
	colorMode: {
		classSuffix: "",
		preference: "system",
		fallback: "light",
	},

	// Configuration CSS - importé dans app.vue

	// Configuration TypeScript
	typescript: {
		strict: true,
		typeCheck: false, 
	},

	// Configuration Nitro pour sqlite3
	nitro: {
		rollupConfig: {
			external: ['sqlite3'],
		},
	},
});
function defineNuxtConfig<T extends Record<string, any>>(config: T): T {
	return config;
}

