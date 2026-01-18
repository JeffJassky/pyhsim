import { createApp } from 'vue';
import { createPinia } from 'pinia';
import FloatingVue from 'floating-vue';
import 'floating-vue/dist/style.css';
import App from './App.vue';
import router from './router';
import '@/assets/base.css';
import { INTERVENTIONS } from '@/models/registry/interventions';
import { validateInterventionLibrary } from '@/models/physiology/pharmacology/validation';

// Runtime Validation
const validationErrors = validateInterventionLibrary(INTERVENTIONS);
if (validationErrors.length > 0) {
  const messages = validationErrors.map(e => `[${e.interventionKey}] ${e.message}`).join('\n');
  console.error('CRITICAL: Intervention Library Validation Failed:\n', messages);
  throw new Error(`Intervention Library Validation Failed:\n${messages}`);
}

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(FloatingVue);
app.mount('#app');
