import { ss } from '@/utils/storage'

const LOCAL_NAME = 'userStorage'

export interface UserInfo {
  email: string
  avatar: string
  name: string
  description: string
  root: boolean
  openid: string
  score: number
  status: number
  token: string
  unionid: string
  vipType: string
  vipStart: string
  vipEnd: string
}

export interface UserState {
  userInfo: UserInfo
}

export function defaultSetting(): UserState {
  return {
    userInfo: {
      email: '',
      avatar: '',
      name: '',
      description: '',
      score: 0,
      root: false,
      status: 0,
      openid: '',
      token: '',
      unionid: '',
      vipType: '',
      vipStart: '',
      vipEnd: '',
    },
  }
}

export function getLocalState(): UserState {
  const localSetting: UserState | undefined = ss.get(LOCAL_NAME)
  return { ...defaultSetting(), ...localSetting }
}

export function setLocalState(setting: UserState): void {
  ss.set(LOCAL_NAME, setting)
}
