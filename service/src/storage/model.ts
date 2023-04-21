import type { ObjectId } from 'mongodb'

export enum Status {
  Normal = 0,
  Deleted = 1,
  InversionDeleted = 2,
  ResponseDeleted = 3,
  PreVerify = 4,
  AdminVerify = 5,
  NoScore = 6,
}

export class UserInfo {
  _id: ObjectId
  name?: string
  email?: string
  password?: string
  status: Status
  createTime: string
  verifyTime?: string
  avatar?: string
  description?: string
  score: number
  openid: string
  constructor(email?: string, password?: string, score?: number, openid?: string) {
    this.name = email
    this.email = email
    this.password = password
    this.score = score
    this.openid = openid
    this.status = openid ? Status.Normal : Status.PreVerify
    this.createTime = new Date().toLocaleString()
    this.verifyTime = null
  }
}

export class ChatRoom {
  _id: ObjectId
  roomId: number
  userId: string
  title: string
  status: Status = Status.Normal
  constructor(userId: string, title: string, roomId: number) {
    this.userId = userId
    this.title = title
    this.roomId = roomId
  }
}

export class Recharge {
  _id: ObjectId
  userId: string
  amount: number
  createTime: string
  paymentMethod?: string
  remark?: string
  transactionId?: string
  constructor(userId: string, amount: number, paymentMethod?: string, transactionId?: string, remark?: string) {
    this.userId = userId
    this.amount = amount
    // 手动充值是0101开头
    this.paymentMethod = paymentMethod || '手动充值'
    this.transactionId = transactionId || `0101${new Date().getTime()}`
    this.remark = remark || ''
    this.createTime = new Date().toLocaleString()
  }
}

export class ChatOptions {
  parentMessageId?: string
  messageId?: string
  constructor(parentMessageId?: string, messageId?: string) {
    this.parentMessageId = parentMessageId
    this.messageId = messageId
  }
}

export class ChatInfo {
  _id: ObjectId
  roomId: number
  uuid: number
  dateTime: number
  prompt: string
  response?: string
  status: Status = Status.Normal
  options: ChatOptions
  constructor(roomId: number, uuid: number, prompt: string, options: ChatOptions) {
    this.roomId = roomId
    this.uuid = uuid
    this.prompt = prompt
    this.options = options
    this.dateTime = new Date().getTime()
  }
}

export class Config {
  constructor(
    public _id: ObjectId,
    public timeoutMs: number,
    public apiKey?: string,
    public apiDisableDebug?: boolean,
    public accessToken?: string,
    public apiBaseUrl?: string,
    public apiModel?: string,
    public reverseProxy?: string,
    public socksProxy?: string,
    public socksAuth?: string,
    public httpsProxy?: string,
    public siteConfig?: SiteConfig,
    public mailConfig?: MailConfig,
  ) { }
}

export class SiteConfig {
  constructor(
    public siteTitle?: string,
    public loginEnabled?: boolean,
    public loginSalt?: string,
    public registerEnabled?: boolean,
    public registerMails?: string,
    public siteDomain?: string,
  ) { }
}

export class MailConfig {
  constructor(
    public smtpHost: string,
    public smtpPort: number,
    public smtpTsl: boolean,
    public smtpUserName: string,
    public smtpPassword: string,
  ) { }
}
export class Token {
  _id: ObjectId
  access_token: string
  expires_in: Number
  refresh_token: string
  openid: string
  scope: string
  unionid: string
  create_at: string
  constructor(access_token?: string, expires_in?: number, refresh_token?: string, openid?: string, scope?: string, unionid?: string, create_at?: string) {
    this.access_token = access_token
    this.expires_in = 7200
    this.refresh_token = refresh_token
    this.openid = openid
    this.scope = scope
    this.unionid = unionid
    this.create_at = create_at
  }
}
