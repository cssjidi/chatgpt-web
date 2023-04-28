<script lang="ts" setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const authStore = useAuthStore()

const { token } = route.params as { token: string }

const ms = useMessage()

const authLogin = async () => {
    try {
        await authStore.setToken(token)
        ms.success('自动登陆成功')
    } catch (error: any) {
        ms.error(error.message ?? 'error')
    } finally {
        loading.value = false
    }
    router.push('/')
}
authLogin()
</script>

<template>
  <div>
    自动登陆中...
  </div>
</template>
