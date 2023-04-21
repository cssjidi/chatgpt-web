<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import { wechatLogin } from '@/api'
import { NSpace } from 'naive-ui'

const qrcodeUrl = ref<string>('')

onMounted(async () => {
  const result = await wechatLogin()
  qrcodeUrl.value = result.data
});
</script>

<template>
  <NSpace justify="center">
    <iframe width="300" height="400" :src="qrcodeUrl" />
  </NSpace>
</template>
