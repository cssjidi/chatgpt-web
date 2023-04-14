<script lang="ts" setup>
import { ref } from 'vue'
import { NButton, NInput, NInputNumber, NSelect, useMessage } from 'naive-ui'
import { useRechargeStore } from '@/store'

const rechargeStore = useRechargeStore()

const ms = useMessage()

const email = ref('')

const methonds = [
  {
    label: '支付宝',
    value: 'alipay',
  },
  {
    label: '微信',
    value: 'wechat',
  },
  {
    label: '银行转账',
    value: 'bank',
  }]

const paymentMethod = ref('wechat')

const score = ref(0)

const remark = ref('')

const transactionId = ref('')

const selectOtherMethod = (value: string) => paymentMethod.value = value

const handleSubmit = async () => {
  if (!email.value) {
    ms.error('充值账号不能为空')
    return
  }
  try {
    await rechargeStore.addRechargeRecord({ email: email.value, amount: score.value, paymentMethod: paymentMethod.value, transactionId: transactionId.value, remark: remark.value })
    email.value = ''
    score.value = 0
    paymentMethod.value = 'wechat'
    transactionId.value = ''
    remark.value = ''
    ms.success('充值成功')
  }
  catch (error: any) {
    ms.error(error.message ?? 'error')
  }
}
</script>

<template>
  <div class="p-4 space-y-5 min-h-[200px]">
    <div class="space-y-6">
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.rechargeAccount') }}</span>
        <div class="flex-1">
          <NInput v-model:value="email" required placeholder="" />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.amount') }}</span>
        <div class="flex-1">
          <NInputNumber v-model:value="score" required placeholder="" />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.method') }}</span>
        <div class="flex-1">
          <NSelect v-model:value="paymentMethod" :options="methonds" @update:value="selectOtherMethod" />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.transaction') }}</span>
        <div class="flex-1">
          <NInput v-model:value="transactionId" placeholder="" />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.remark') }}</span>
        <div class="flex-1">
          <NInput v-model:value="remark" type="textarea" placeholder="" />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]" />
        <NButton type="primary" @click="handleSubmit">
          {{ $t('common.recharge') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
