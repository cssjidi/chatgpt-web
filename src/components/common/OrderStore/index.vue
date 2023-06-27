<script lang="ts" setup>
import { computed, ref, watchEffect } from 'vue'
import { NModal, NTable } from 'naive-ui'
import moment from 'moment'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useRechargeStore } from '@/store'

interface Props {
  visible: boolean
}

interface Emit {
  (e: 'update:visible', visible: boolean): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const rechargeStore = useRechargeStore()

const rechargeList = ref<any>([])

const show = computed({
  get: () => props.visible,
  set: (visible: boolean) => emit('update:visible', visible),
})

const handleClose = () => {
}

const { isMobile } = useBasicLayout()

const customStyle = isMobile.value ? 'width: 90%; max-width: 900px' : 'width: 75%; max-width: 800px'

const status: any = {
  refund: '退款',
  processing: '未支付',
  success: '成功',
}

watchEffect(async () => {
  if (props.visible) {
    await rechargeStore.fetchRecharge()
    rechargeList.value = rechargeStore.rechargeList
  }
})
</script>

<template>
  <NModal v-model:show="show" title="订单列表" :style="customStyle" preset="card" @close="handleClose">
    <NTable size="medium">
      <thead>
        <tr>
          <td width="20%">
            订单号
          </td>
          <td width="20%">
            VIP类型
          </td>
          <td width="20%">
            下单时间
          </td>
          <td width="20%">
            成交金额
          </td>
          <td width="20%">
            订单状态
          </td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) of rechargeList" :key="index">
          <td>{{ item.transactionId }}</td>
          <td>{{ item.remark }}</td>
          <td>{{ moment(item.createTime).format('YYYY-MM-DD HH:mm:ss') }}</td>
          <td>￥{{ item.amount / 100 }}</td>
          <td>{{ status[item.status.toLowerCase()] }}</td>
        </tr>
      </tbody>
    </NTable>
  </NModal>
</template>
