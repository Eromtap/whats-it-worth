<script setup>
import { reactive, ref } from 'vue'

const emit = defineEmits(['login', 'register'])
defineProps({
  errorMessage: { type: String, default: '' },
})

const loginEmail = ref('jordan@example.com')
const registerForm = reactive({ name: '', email: '', city: '' })
const loginMessage = ref('')

function submitLogin() {
  emit('login', {
    email: loginEmail.value,
    onResult(result) {
      loginMessage.value = result?.message || ''
    },
  })
}

function submitRegister() {
  emit('register', { ...registerForm })
  registerForm.name = ''
  registerForm.email = ''
  registerForm.city = ''
}
</script>

<template>
  <section class="auth-shell">
    <div class="auth-copy">
      <span class="eyebrow">Working MVP</span>
      <h1>Inventory your home, price it with comps, and control what reaches the market.</h1>
      <p>
        This version now talks to a local Express backend for app state. It still uses seeded demo data while the
        hosted auth, payments, and live pricing integrations are being built.
      </p>
      <ul class="auth-points">
        <li>Private-by-default inventory</li>
        <li>Value ranges and sold comp snapshots</li>
        <li>Public listings and blind offers</li>
        <li>Offer inbox with accept and decline workflows</li>
      </ul>
    </div>

    <div class="auth-cards">
      <article class="panel">
        <h2>Sign in</h2>
        <p>Use the seeded demo account or any account you already created in this browser.</p>
        <label>
          Email
          <input v-model="loginEmail" type="email" placeholder="jordan@example.com" />
        </label>
        <button class="button button-primary" type="button" @click="submitLogin">Continue</button>
        <p v-if="loginMessage" class="inline-feedback">{{ loginMessage }}</p>
        <p v-if="errorMessage" class="inline-feedback">{{ errorMessage }}</p>
      </article>

      <article class="panel">
        <h2>Create local account</h2>
        <p>This is MVP auth only. Accounts are now persisted by the local backend.</p>
        <label>
          Name
          <input v-model="registerForm.name" type="text" placeholder="Morgan Lee" />
        </label>
        <label>
          Email
          <input v-model="registerForm.email" type="email" placeholder="morgan@example.com" />
        </label>
        <label>
          City
          <input v-model="registerForm.city" type="text" placeholder="Chicago, IL" />
        </label>
        <button
          class="button button-secondary"
          type="button"
          :disabled="!registerForm.name || !registerForm.email || !registerForm.city"
          @click="submitRegister"
        >
          Create account
        </button>
      </article>
    </div>
  </section>
</template>
