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

interface Props {
  visible: boolean
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const { isMobile } = useBasicLayout()

const show = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})
const customStyle = isMobile.value ? 'width: 90%; max-width: 900px' : 'width: 30%; max-width: 300px'
</script>

<template>
  <NModal v-model:show="show" title="关注51chat公众号" :style="customStyle" preset="card">
    <NCard
      title="关注后根据指引完成充值"
    >
      <NImage :src="wechatImage" :fallback-src="defaultImage" />
    </NCard>
  </NModal>
</template>
