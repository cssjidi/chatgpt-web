<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import { wechatLogin } from '@/api'
import { NSpace, NImage, NCard } from 'naive-ui'

import wechatImage from '@/assets/wechat.png'
import defaultImage from '@/assets/website.png'

interface Props {
  wechat: boolean
}

defineProps<Props>()

const qrcodeUrl = ref<string>('')

onMounted(async () => {
  const result = await wechatLogin()
  qrcodeUrl.value = result.data
})
</script>

<template>
  <NSpace v-if="!wechat" justify="center">
    <iframe width="300" height="400" :src="qrcodeUrl" />
  </NSpace>
  <NSpace v-if="wechat" justify="center" style="background-color: #fff;">
    <NCard title="关注并授权后自动登陆" />
    <NImage :src="wechatImage" :fallback-src="defaultImage" />
  </NSpace>
</template>
