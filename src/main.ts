import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import './style.css'
import App from './App.vue'
import DashboardPage from './pages/DashboardPage.vue'
import SearchPage from './pages/SearchPage.vue'
import ShowDetailsPage from './pages/ShowDetailsPage.vue'
import NotFoundPage from './pages/NotFoundPage.vue'

void import('tvmaze_ui/styles')

// Route names mirror the host so pages can navigate by name in either app.
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage },
    { path: '/search', name: 'search', component: SearchPage },
    { path: '/shows/:id', name: 'show', component: ShowDetailsPage },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
  ],
})

createApp(App).use(createPinia()).use(router).mount('#app')
