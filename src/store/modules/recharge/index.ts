import { defineStore } from 'pinia'
import { fetchRechargeInfo } from '../../../api/'
import type { RechargeState } from './helper'
import { getLocalRechargeList, setLocalRechargeList } from './helper'

export const useRechargeStore = defineStore('recharge-store', {
  state: (): RechargeState => getLocalRechargeList(),
  actions: {
    async updateRechargeList(rechargeList: any) {
      this.$patch({ rechargeList })
      setLocalRechargeList({ rechargeList })
    },
    async fetchRecharge() {
      const result = await fetchRechargeInfo()
      this.updateRechargeList(result.data)
    },
    recordState() {
      setLocalRechargeList(this.$state)
    },
    getRechargeList() {
      return this.$state
    },
  },
})
