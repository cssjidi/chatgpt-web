<script setup lang="ts">
import { computed } from 'vue'
import {
  NCard,
  NImage,
  NModal,
} from 'naive-ui'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import wechatImage from '@/assets/wechat.png'
import defaultImage from '@/assets/website.png'
import prodImage from '@/assets/prod.jpg'

interface Props {
  visible: boolean
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const qrCode = location.href.includes('dev') ? wechatImage : prodImage

const { isMobile } = useBasicLayout()

const show = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})
const customStyle = isMobile.value ? 'width: 90%; max-width: 900px' : 'width: 30%; max-width: 300px'
</script>

<template>
  <NModal v-model:show="show" title="扫码充值" :style="customStyle" preset="card">
    <NCard
      title="关注公众号后，点击下方“购买会员"
    >
      <NImage :src="qrCode" :fallback-src="defaultImage" />
    </NCard>
  </NModal>
</template>
