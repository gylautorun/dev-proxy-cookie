<script setup>
import { ref } from 'vue'

const response = ref('')

async function fetchData() {
  try {
    const res = await fetch('/api/test');
    response.value = await res.text();
  } catch (err) {
    response.value = 'Error: ' + err.message;
  }
}
</script>

<template>
  <div id="app">
    <h1>Vite Demo - dev-proxy-cookie</h1>
    <p>This is a Vite + Vue 3 project demonstrating dev-proxy-cookie usage.</p>
    <button @click="fetchData">Fetch Data</button>
    <div v-if="response">{{ response }}</div>
  </div>
</template>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>