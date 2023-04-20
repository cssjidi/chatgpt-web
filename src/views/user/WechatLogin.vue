<script lang="ts" setup>
import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store'
import { wechatLogin } from '@/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const authStore = useAuthStore()

const { uuid } = route.params as { uuid: string }

const ms = useMessage()

const authLogin = async () => {
    try {
        const result = await wechatLogin(uuid)
        await authStore.setToken(result.data.token)
        ms.success('success')
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

