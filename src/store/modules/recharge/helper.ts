import { ss } from '@/utils/storage'

const LOCAL_NAME = 'rechargeStore'

export type RechargeList = []
export interface RechargeState {
  rechargeList: RechargeList
}

export function getLocalRechargeList(): RechargeState {
  const rechargeStore: RechargeState | undefined = ss.get(LOCAL_NAME)
  return rechargeStore ?? { rechargeList: [] }
}

export function setLocalRechargeList(rechargeStore: RechargeState): void {
  ss.set(LOCAL_NAME, rechargeStore)
}
