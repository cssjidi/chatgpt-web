<script setup lang='ts'>
import { computed } from 'vue'
import { NAvatar, NImage } from 'naive-ui'
import { useUserStore } from '@/store'
import defaultAvatar from '@/assets/avatar.jpg'
import VIPImage from '@/assets/vip.png'
import { isString } from '@/utils/is'

const userStore = useUserStore()

const userInfo = computed(() => userStore.userInfo)
</script>

<template>
  <div class="overflow-hidden flex p-2 items-center justify-between">
    <div class="overflow-hidden rounded-full overflow-hidden">
      <template v-if="isString(userInfo.avatar) && userInfo.avatar.length > 0">
        <NAvatar
          size="large"
          round
          :src="userInfo.avatar"
          :fallback-src="defaultAvatar"
        />
      </template>
      <template v-else>
        <NAvatar size="large" round :src="defaultAvatar" />
      </template>
    </div>
    <div class="min-w-0 ml-2 flex-1 flex-shrink-0 overflow-hidden py-3">
      <h2 v-if="userInfo.name" class="overflow-hidden font-bold text-md text-ellipsis whitespace-nowrap">
        {{ userInfo.name }}
        <NImage v-if="userInfo.vipType" :src="VIPImage" />
      </h2>
      <h2 v-else class="overflow-hidden font-bold text-md text-ellipsis whitespace-nowrap">
        {{ $t('common.notLoggedIn') }}
      </h2>
      <div>
        <span class="align-middle inline-block" style="font-size:10px;">积分:{{ userInfo.score }}</span>
      </div>
    </div>
  </div>
</template>
