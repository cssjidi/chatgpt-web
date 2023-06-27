<script setup lang='ts'>
import { computed, ref } from 'vue'
import { NModal } from 'naive-ui'
import PromptRecommend from '../../../assets/recommend.json'
import { usePromptStore } from '@/store'

interface Props {
  visible: boolean
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const promptStore = usePromptStore()

const show = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})

const tags = ref<any>([])

const promptList = ref<any>([])

const tag = ref('')

tags.value = PromptRecommend.tags

promptList.value = PromptRecommend.prompts

const filteredData = computed(() => {
  if (tag.value)
    return promptList.value.filter((item: any) => item.tags.includes(tag.value))
  return []
})

const showTags = (tag: string) => {
  const result = tags.value.find((item: any) => item.tag === tag)
  return result.msg
}
const activeTab = (item: any) => {
  tag.value = item
}

activeTab('favorite')
const userPrompt = (id: number) => {
  const result = promptList.value.find((item: any) => item.id === id)
  emit('update:visible', false)
  promptStore.updatePromptList(result.desc_cn)
}
</script>

<template>
  <NModal v-model:show="show" title="推荐消息模板" style="width: 95%; max-width: 1280px;" preset="card">
    <div class="prompt-container">
      <div class="prompt-container-category">
        <ul>
          <li v-for="(item, index) of tags" :key="index" :class="tag === item.tag ? 'category_selected' : 'category_normal'" @click="activeTab(item.tag)">
            <span>{{ item.msg }}</span>
          </li>
        </ul>
      </div>
      <div class="prompt-container-body">
        <div v-for="(item, index) of filteredData" :key="index" class="prompt-body-card">
          <div class="prompt-body-title">
            <span>{{ item.title }}</span>
            <span class="prompt-use" @click="userPrompt(item.id)">使用</span>
          </div>
          <div class="prompt-body-desc">
            {{ item.remark }}
          </div>
          <div class="prompt-body-content">
            {{ item.desc_cn }}
          </div>
          <div v-if="false" class="prompt-body-tag">
            <span v-for="(sub, i) of item.tags" :key="i">{{ showTags(sub) }}</span>
          </div>
        </div>
      </div>
    </div>
  </NModal>
</template>
