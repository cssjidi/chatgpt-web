<script setup lang='ts'>
import { NGi, NGrid } from 'naive-ui'
import { usePromptStore } from '@/store'

const promptStore = usePromptStore()

const tips = [{
  title: 'AI创作',
  cols: [{
    id: 1000,
    title: '写一首情诗',
  }, {
    id: 1001,
    title: '写一个放假通知',
  }, {
    id: 1002,
    title: '写一个系统升级通告，50字以上',
  }],
},
{
  title: '有趣的问题',
  cols: [{
    id: 1003,
    title: '狗为什么总喜欢追着自己的尾巴',
  }, {
    id: 1004,
    title: '蚂蚁如何才能打败大象',
  }, {
    id: 1005,
    title: '未来会不会出现时间机器',
  }],
},
{
  title: 'AI百科',
  cols: [{
    id: 1006,
    title: '煮面为什么要先烧水',
  }, {
    id: 1007,
    title: '睡觉到底要不要关灯',
  }, {
    id: 1008,
    title: '身体容易出汗是好还是坏',
  }],
},
]
const userPrompt = (prompt: any) => {
  promptStore.updatePromptList(prompt.title)
}
</script>

<template>
  <h1 class="text-center text-3xl mb-10 mt-20">
    <b>轻舟AI</b>-工作从此轻松
  </h1>
  <NGrid x-gap="12" :cols="tips.length">
    <NGi v-for="(item, i) of tips" :key="i" class="px-8 leading-10">
      <h2 class="text-left text-2xl mb-5">
        {{ item.title }}
      </h2>
      <div v-for="(sub, index) of item.cols" :key="index" class="cursor-pointer" @click="userPrompt(sub)">
        {{ sub.title }}
      </div>
    </NGi>
  </NGrid>
</template>
