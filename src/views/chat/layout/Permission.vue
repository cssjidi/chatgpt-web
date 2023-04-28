<script setup lang='ts'>
import { computed, onMounted, ref } from 'vue'
import { NButton, NInput, NModal, NTabPane, NGrid, NGi, NTabs, useMessage } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { fetchLogin, fetchRegister, fetchVerify } from '@/api'
import { useAuthStore } from '@/store'
import { WechatLogin } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'

interface Props {
  visible: boolean
}

defineProps<Props>()

const { isWechat } = useBasicLayout()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const ms = useMessage()

const loading = ref(false)
const username = ref('')
const password = ref('')

const disabled = computed(() => !username.value.trim() || !password.value.trim() || loading.value)

const activeTab = ref('login')

const showConfirmPassword = ref(false)
const confirmPassword = ref('')

function handlePasswordInput() {
  showConfirmPassword.value = password.value.trim() !== ''
}

const confirmPasswordStatus = computed(() => {
  if (!password.value || !confirmPassword.value)
    return undefined
  return password.value !== confirmPassword.value ? 'error' : 'success'
})

onMounted(async () => {
  const verifytoken = route.query.verifytoken as string
  await handleVerify(verifytoken)
})

async function handleVerify(verifytoken: string) {
  if (!verifytoken)
    return
  const secretKey = verifytoken.trim()

  try {
    loading.value = true
    await fetchVerify(secretKey)
    ms.success('验证成功 | Verify successfully')
    router.replace('/')
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
  }
  finally {
    loading.value = false
  }
}

function handlePress(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    handleLogin()
  }
}

async function handleLogin() {
  const name = username.value.trim()
  const pwd = password.value.trim()

  if (!name || !pwd)
    return

  try {
    loading.value = true
    const result = await fetchLogin(name, pwd)
    await authStore.setToken(result.data.token)
    ms.success('success')
    router.go(0)
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
    password.value = ''
  }
  finally {
    loading.value = false
  }
}

async function handleRegister() {
  const name = username.value.trim()
  const pwd = password.value.trim()
  const confirmPwd = confirmPassword.value.trim()

  if (!name || !pwd || !confirmPwd || pwd !== confirmPwd) {
    ms.error('两次输入的密码不一致 | Passwords don\'t match')
    return
  }

  try {
    loading.value = true
    const result = await fetchRegister(name, pwd)
    ms.success(result.message as string)
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
  }
  finally {
    loading.value = false
  }
}
const gotoForgotPassword = () => router.push('/forgot-password')
</script>

<template>
  <NModal :show="visible" style="width: 90%; max-width: 720px;overflow: hidden;">
    <div v-if="isWechat">
      <WechatLogin wechat="true" />
    </div>
    <div v-if="!isWechat" class="bg-white rounded dark:bg-slate-800">
      <NGrid x-gap="6" :cols="2">
        <NGi>
          <div class="my-10 overflow-hidden">
            <WechatLogin />
          </div>
        </NGi>
        <NGi class="my-3 p-3 px-3 mr-3">
          <header class="space-y-2 my-8">
            <h1 class="text-5xl font-bold text-center text-slate-800 light:text-neutral-200" style="color:#06b6d4">
              AI无忧
            </h1>
            <p class="text-base text-center text-slate-500 dark:text-slate-500">
              开启智能模式，助你办公无忧
            </p>
          </header>
          <div class="space-y-2">
            <NTabs v-model:value="activeTab" type="line">
              <NTabPane name="login" :tab="$t('common.login')">
                <NInput v-model:value="username" type="text" :placeholder="$t('common.email')" class="mb-2" />
                <NInput v-model:value="password" type="password" :placeholder="$t('common.password')" class="mb-2" @keypress="handlePress" />
                <div class="text-right"><a href="javascript:void(0)" @click="gotoForgotPassword">忘记密码?</a></div>
                <NButton block type="primary" :disabled="disabled" :loading="loading" @click="handleLogin">
                  {{ $t('common.login') }}
                </NButton>
              </NTabPane>
              <NTabPane v-if="authStore.session && authStore.session.allowRegister" name="register" :tab="$t('common.register')">
                <NInput v-model:value="username" type="text" :placeholder="$t('common.email')" class="mb-2" />
                <NInput v-model:value="password" type="password" :placeholder="$t('common.password')" class="mb-2" @input="handlePasswordInput" />
                <NInput
                  v-if="showConfirmPassword"
                  v-model:value="confirmPassword"
                  type="password"
                  :placeholder="$t('common.passwordConfirm')"
                  class="mb-4"
                  :status="confirmPasswordStatus"
                />

                <NButton block type="primary" :disabled="disabled || password !== confirmPassword" :loading="loading" @click="handleRegister">
                  {{ $t('common.register') }}
                </NButton>
              </NTabPane>
            </NTabs>
          </div>
        </NGi>
      </NGrid>
    </div>
  </NModal>
</template>
