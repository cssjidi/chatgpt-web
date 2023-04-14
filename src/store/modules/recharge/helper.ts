export interface RechargeInfo {
  email: string
  amount: number
  paymentMethod?: string
  transactionId?: string
  remark?: string
}

export interface RechargeState {
  rechargeInfo: RechargeInfo
}
