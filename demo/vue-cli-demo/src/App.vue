<template>
  <div id="app">
    <h1>Vue CLI Demo - dev-proxy-cookie</h1>
    <p>This is a Vue CLI project demonstrating dev-proxy-cookie usage.</p>
    <button @click="fetchData">Fetch Data</button>
    <div v-if="response">{{ response }}</div>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      response: ''
    }
  },
  methods: {
    async fetchData() {
      try {
        const res = await fetch('/api/test');
        this.response = await res.text();
      } catch (err) {
        this.response = 'Error: ' + err.message;
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>