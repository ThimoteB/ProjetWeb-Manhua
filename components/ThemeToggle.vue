<!--
ThemeToggle.vue
Composant bouton pour changer le thème (clair/sombre).
Affiche l'icône correspondante et utilise useColorMode.
-->
<template>
   <button
	   @click="toggleColorMode"
	   class="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100"
	   title="Changer de thème"
   >
	   <img
		   v-if="colorMode.value === 'dark'"
		   src="/icons/sun.svg"
		   alt="Mode clair"
		   class="w-6 h-6"
	   />
	   <img v-else src="/icons/moon.svg" alt="Mode sombre" class="w-6 h-6" />
   </button>
</template>

<script setup>
const colorMode = useColorMode();

function toggleColorMode() {
	colorMode.preference = colorMode.value === "dark" ? "light" : "dark";
}
</script>
