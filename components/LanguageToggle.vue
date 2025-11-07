<!--
LanguageToggle.vue
Composant bouton pour changer la langue de l'interface (français/anglais).
Affiche le drapeau correspondant à la langue cible.
Utilise useI18n pour gérer le changement de langue.
-->
<template>
	<button
		@click="switchLanguage"
		class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100"
		title="Changer de langue"
	>
		<img
			:src="locale === 'fr' ? '/flags/gb.svg' : '/flags/fr.svg'"
			:alt="locale === 'fr' ? 'English' : 'Français'"
			class="w-6 h-4 rounded-sm border border-gray-300 dark:border-gray-600"
		/>
	</button>
</template>

<script setup>
const { locale, setLocale } = useI18n();

function switchLanguage() {
	setLocale(locale.value === "fr" ? "en" : "fr");
}
</script>
