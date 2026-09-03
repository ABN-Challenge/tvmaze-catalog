import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import DashboardPage from './pages/DashboardPage.vue'
import SearchPage from './pages/SearchPage.vue'
import ShowDetailsPage from './pages/ShowDetailsPage.vue'

void import('tvmaze_ui/styles')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DashboardPage },
    { path: '/search', component: SearchPage },
    { path: '/shows/:id', component: ShowDetailsPage },
  ],
})

createApp(App).use(createPinia()).use(router).mount('#app')
