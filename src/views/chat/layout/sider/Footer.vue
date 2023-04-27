<script setup lang='ts'>
import { defineAsyncComponent, ref, computed } from 'vue'
import { HoverButton, SvgIcon, UserAvatar } from '@/components/common'
import { useAuthStore, useUserStore } from '@/store'
const Setting = defineAsyncComponent(() => import('@/components/common/Setting/index.vue'))

const authStore = useAuthStore()
const userStore = useUserStore()

const show = ref(false)

async function handleLogout() {
  await authStore.removeToken()
}
const userInfo = computed(() => userStore.userInfo)
</script>

<template>
  <footer class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">
    <div>
      <span v-if="!userInfo.vipType" style="border: 1px solid #00C1C1" class="p-0.5 px-1 rounded-md -mt-12 -ml-2 absolute text-xs">
        免费会员
      </span>
      <span v-else-if="userInfo.vipType" style="border: 1px solid #00C1C1" class="p-0.5 px-1 rounded-md -mt-12 -ml-2 absolute text-xs">
        VIP会员
      </span>
    </div>
    <div class="flex-1 flex-shrink-0 overflow-hidden">
      <UserAvatar />
    </div>
    <div>
      <HoverButton v-if="!!authStore.token" :tooltip="$t('common.logOut')" @click="handleLogout">
        <span class="text-xl text-[#4f555e] dark:text-white">
          <SvgIcon icon="uil:exit" />
        </span>
      </HoverButton>
      <HoverButton :tooltip="$t('setting.setting')" @click="show = true">
        <span class="text-xl text-[#4f555e] dark:text-white">
          <SvgIcon icon="ri:settings-4-line" />
        </span>
      </HoverButton>
    </div>
    <Setting v-if="show" v-model:visible="show" />
  </footer>
</template>
