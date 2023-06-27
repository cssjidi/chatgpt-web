<script setup lang='ts'>
import { onMounted, ref } from 'vue'
import { NCard, NImage, NSpace } from 'naive-ui'
import { wechatLogin } from '@/api'

import wechatImage from '@/assets/wechat.png'
import defaultImage from '@/assets/website.png'
import prodImage from '@/assets/prod.jpg'

interface Props {
  wechat: boolean
}

defineProps<Props>()

const chatImage = location.href.includes('dev') ? wechatImage : prodImage

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
    <NImage :src="chatImage" :fallback-src="defaultImage" />
  </NSpace>
</template>
