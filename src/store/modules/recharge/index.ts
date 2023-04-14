import { defineStore } from 'pinia'
import type { RechargeInfo } from './helper'
import { invest } from '@/api'

export interface RechargeState {
  userId: string
  amount: number
  createTime: string
  paymentMethod: string
  remark: string
  transactionId: string
}

export const useRechargeStore = defineStore('recharge-store', {
  state: (): RechargeState => ({
    userId: '',
    amount: 0,
    createTime: '',
    paymentMethod: '',
    remark: '',
    transactionId: '',
  }),

  getters: {

  },

  actions: {
    addRechargeRecord(recharge: RechargeInfo) {
      invest(recharge)
    },
  },
})
