<script lang="ts" setup>
import type { ComponentInternalInstance } from 'vue'
import { ref } from 'vue'
import type { FormRules } from 'naive-ui'
import { NButton, NCard, NForm, NFormItem, NInput, useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import { resetPassword, sendCodeByMail } from '@/api'
import { useAuthStore } from '@/store'

const form = ref({
  email: '',
  code: '',
  password: '',
  confirmPassword: '',
})
const formRef = ref<ComponentInternalInstance>()
const formValid = false
const router = useRouter()
const authStore = useAuthStore()

const COUNTDOWN_SECONDS = 60

const ms = useMessage()

const submitLoading = ref(false)
const countdown = ref(0)
const isValidForm = ref(false)

const rules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== form.value.password)
          callback(new Error('两次密码输入不一致'))
        else
          callback()
      },
      trigger: 'blur',
    },
  ],
}
const sendCode = async () => {
  if (countdown.value > 0)
    return // 如果正在倒计时则不执行发送操作
  // 验证邮箱是否输入
  if (!form.value.email) {
    ms.error('请输入邮箱！')
    return
  }
  countdown.value = COUNTDOWN_SECONDS

  const intervalId = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0)
      clearInterval(intervalId)
  }, 1000)
  await sendCodeByMail(form.value.email)
}

const validateForm = () => {
  const form = formRef.value
  form && form.validate && form.validate((valid: boolean) => {
    isValidForm.value = valid
  })
}

const handleSubmit = async () => {
  validateForm()
  if (formValid)
    submitLoading.value = true
  try {
    await resetPassword(form.value.email, form.value.code, form.value.password)
    ms.success('密码修改成功！')
    await authStore.removeToken()
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
  }
}

const handleClose = () => {
  router.push('/')
}
</script>

<template>
  <NCard title="重置密码" size="large" closable hoverable @close="handleClose">
    <NForm ref="formRef" :model="form" label-position="top" :rules="rules">
      <NFormItem label="邮箱" required path="email">
        <NInput v-model:value="form.email" placeholder="请输入邮箱" />
      </NFormItem>
      <NFormItem label="验证码" required path="code">
        <NInput v-model:value="form.code" type="text" maxlength="6" placeholder="请输入验证码" />
        <NButton :disabled="countdown > 0" @click="sendCode">
          {{ countdown > 0 ? `${countdown}秒后重试` : "发送验证码" }}
        </NButton>
      </NFormItem>
      <NFormItem label="新密码" required path="password">
        <NInput v-model:value="form.password" type="password" placeholder="请输入新密码" />
      </NFormItem>
      <NFormItem label="确认密码" required path="confirmPassword">
        <NInput v-model:value="form.confirmPassword" type="password" placeholder="请再次输入新密码" />
      </NFormItem>
      <NFormItem>
        <NButton block type="primary" :loading="submitLoading" @click="handleSubmit">
          提交
        </NButton>
      </NFormItem>
    </NForm>
  </NCard>
</template>
