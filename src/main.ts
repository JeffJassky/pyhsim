import { createApp } from 'vue';
import { createPinia } from 'pinia';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import App from './App.vue';
import router from './router';
import '@/assets/base.css';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(FloatingVue);
app.mount('#app');
