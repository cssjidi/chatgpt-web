<script lang="ts" setup>
import { computed, ref } from 'vue'
import { NAvatar, NButton, NInput, NText, useMessage } from 'naive-ui'
import { useUserStore } from '@/store'
import type { UserInfo } from '@/store/modules/user/helper'
import { t } from '@/locales'

const userStore = useUserStore()

const ms = useMessage()

const userInfo = computed(() => userStore.userInfo)

const isAvatar = ref(false)

const email = ref(userInfo.value.email ?? '')

const avatar = ref(userInfo.value.avatar ?? '')

const name = ref(userInfo.value.name ?? '')

const score = ref(userInfo.value.score ?? '')

async function updateUserInfo(options: Partial<UserInfo>) {
  await userStore.updateUserInfo(true, options)
  ms.success(t('common.success'))
}

const showAvatar = () => isAvatar.value = !isAvatar.value
</script>

<template>
  <div class="p-4 space-y-5 min-h-[200px]">
    <div class="space-y-6">
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.avatar') }}</span>
        <div class="flex-1">
          <NAvatar
            round
            bordered
            size="large"
            :src="avatar"
            :fallback-src="avatar"
            @click="showAvatar"
          />
        </div>
      </div>
      <div v-show="isAvatar" class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.avatarLink') }}</span>
        <div class="flex-1">
          <NInput v-model:value="avatar" placeholder="" />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.name') }}</span>
        <div class="w-[200px]">
          <NInput v-model:value="name" placeholder="" />
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.email') }}</span>
        <div class="w-[200px]">
          <NText>{{ email }}</Ntext>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.score') }}</span>
        <div class="w-[200px]">
          <NText>{{ score }}</Ntext>
        </div>
      </div>
      <div class="flex items-center space-x-4">
        <span class="flex-shrink-0 w-[100px]">{{ $t('setting.saveUserInfo') }}</span>
        <NButton type="primary" @click="updateUserInfo({ avatar, name })">
          {{ $t('common.save') }}
        </NButton>
      </div>
    </div>
  </div>
</template>
