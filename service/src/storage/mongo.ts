import { join } from 'path'
import * as dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'

import { ChatInfo, ChatRoom, ChatUsage, Recharge, Status, Token, UserInfo, KeyStore } from './model'
import type { ChatOptions, Config, UsageResponse } from './model'

dotenv.config()
console.log(process.env.MONGODB_URL)
const url = process.env.MONGODB_URL
const client = new MongoClient(url, {
  tls: true,
  tlsCertificateKeyFile: join(__dirname, '../../certs/db.51chat.ai.pem.crt'),
  tlsAllowInvalidCertificates: true,
})

const chatCol = client.db('chatgpt').collection('chat')
const roomCol = client.db('chatgpt').collection('chat_room')
const userCol = client.db('chatgpt').collection('user')
const configCol = client.db('chatgpt').collection('config')
const rechargeCol = client.db('chatgpt').collection('recharge')
const tokenCol = client.db('chatgpt').collection('token')
const usageCol = client.db('chatgpt').collection('chat_usage')
const keyStoreCol = client.db('chatgpt').collection('key_store')

/**
 * 插入聊天信息
 * @param text 内容 prompt or response
 * @param roomId
 * @param options
 * @returns model
 */
export async function insertChat(uuid: number, text: string, roomId: number, options?: ChatOptions) {
  const chatInfo = new ChatInfo(roomId, uuid, text, options)
  await chatCol.insertOne(chatInfo)
  return chatInfo
}

export async function getChat(roomId: number, uuid: number) {
  return await chatCol.findOne({ roomId, uuid })
}

export async function updateChat(chatId: string, response: string, messageId: string, usage: UsageResponse, previousResponse?: []) {
  const query = { _id: new ObjectId(chatId) }
  const update = {
    $set: {
      'response': response,
      'options.messageId': messageId,
      'options.prompt_tokens': usage?.prompt_tokens,
      'options.completion_tokens': usage?.completion_tokens,
      'options.total_tokens': usage?.total_tokens,
      'options.estimated': usage?.estimated,
    },
  }

  if (previousResponse)
    update.$set.previousResponse = previousResponse

  await chatCol.updateOne(query, update)
}

export async function createChatRoom(userId: string, title: string, roomId: number) {
  const room = new ChatRoom(userId, title, roomId)
  await roomCol.insertOne(room)
  return room
}
export async function renameChatRoom(userId: string, title: string, roomId: number) {
  const query = { userId, roomId }
  const update = {
    $set: {
      title,
    },
  }
  const result = await roomCol.updateOne(query, update)
  return result
}

export async function deleteChatRoom(userId: string, roomId: number) {
  const result = await roomCol.updateOne({ roomId, userId }, { $set: { status: Status.Deleted } })
  await clearChat(roomId)
  return result
}

export async function getChatRooms(userId: string) {
  const cursor = await roomCol.find({ userId, status: { $ne: Status.Deleted } })
  const rooms = []
  await cursor.forEach(doc => rooms.push(doc))
  return rooms
}

export async function existsChatRoom(userId: string, roomId: number) {
  const room = await roomCol.findOne({ roomId, userId })
  return !!room
}

export async function deleteAllChatRooms(userId: string) {
  await roomCol.updateMany({ userId, status: Status.Normal }, { $set: { status: Status.Deleted } })
  await chatCol.updateMany({ userId, status: Status.Normal }, { $set: { status: Status.Deleted } })
}

export async function getChats(roomId: number, lastId?: number) {
  if (!lastId)
    lastId = new Date().getTime()
  const query = { roomId, uuid: { $lt: lastId }, status: { $ne: Status.Deleted } }
  const sort = { dateTime: -1 }
  const limit = 20
  const cursor = await chatCol.find(query).sort(sort).limit(limit)
  const chats = []
  await cursor.forEach(doc => chats.push(doc))
  chats.reverse()
  return chats
}

export async function clearChat(roomId: number) {
  const query = { roomId }
  const update = {
    $set: {
      status: Status.Deleted,
    },
  }
  await chatCol.updateMany(query, update)
}

export async function deleteChat(roomId: number, uuid: number, inversion: boolean) {
  const query = { roomId, uuid }
  let update = {
    $set: {
      status: Status.Deleted,
    },
  }
  const chat = await chatCol.findOne(query)
  if (chat.status === Status.InversionDeleted && !inversion) { /* empty */ }
  else if (chat.status === Status.ResponseDeleted && inversion) { /* empty */ }
  else if (inversion) {
    update = {
      $set: {
        status: Status.InversionDeleted,
      },
    }
  }
  else {
    update = {
      $set: {
        status: Status.ResponseDeleted,
      },
    }
  }
  chatCol.updateOne(query, update)
}
/*
export async function createUser(email: string, password: string, score: number): Promise<UserInfo> {
  email = email.toLowerCase()
  const userInfo = new UserInfo(email, password, score)
  if (email === process.env.ROOT_USER)
    userInfo.status = Status.Normal

  await userCol.insertOne(userInfo)
  return userInfo
}
*/

export const getToken = async (openid) => {
  const token = await tokenCol.findOne({ openid })
  return token
}

export const setToken = async ({ openid, ...rest }: Token = new Token()): Promise<Token> => {
  const filter = { openid }
  const options = { upsert: true, returnOriginal: false }
  const update = { $set: { openid, ...rest } }
  const result = await tokenCol.findOneAndUpdate(filter, update, options)
  return result.value as Token
}

export const createUser = async ({ openid, avatar, unionid, name, ...rest }: UserInfo = new UserInfo()): Promise<UserInfo> => {
  const user = await userCol.findOne({ unionid }) as UserInfo
  console.log('user is :', user)
  if (user) {
    // 如果在数据库中找到了用户
    await userCol.updateOne(
      { unionid },
      [{ $set: { avatar, name, verifyTime: new Date().getTime(), status: 0, password: '', email: '' } },
        { $addToSet: { openid } },
      ])
    return user as UserInfo
  }
  else {
    // 如果没有找到用户，则创建一个新用户
    const userInfo = new UserInfo('', '', avatar, name, 10, openid, unionid)
    await userCol.insertOne(userInfo)
    return userInfo
  }
}

export const updateOpenId = async (openid: string, unionid: string): Promise<UserInfo> => {
  const user = await userCol.findOne({ unionid }) as UserInfo
  if (!user)
    throw new Error('no user')
  // 如果在数据库中找到了用户
  await userCol.updateOne({ unionid }, { $addToSet: { openid } })
  return user as UserInfo
}

export async function updateUserInfo(userId: string, user: UserInfo) {
  const result = await userCol.updateOne({ _id: new ObjectId(userId) }
    , { $set: { name: user.name, description: user.description, avatar: user.avatar, score: user.score, status: user.status, password: user.password } })
  return result
}

export async function getUser(emailOrOpenid: string): Promise<UserInfo> {
  if (!emailOrOpenid)
    throw new Error('Invalid input')

  const isEmail = /\S+@\S+\.\S+/.test(emailOrOpenid)
  const query = isEmail ? { email: emailOrOpenid.toLowerCase() } : { unionid: emailOrOpenid }
  console.log(query)
  const result = await userCol.findOne(query)
  if (!result)
    return null
  return result as UserInfo
}

export async function getUserByOpenIdAndToken(openid: string, access_token: string): Promise<UserInfo> {
  const user = await userCol.findOne({ openid }) as UserInfo
  const token = await tokenCol.findOne({ access_token, openid }) as Token
  if (token && user) {
    delete user.openid
    return Object.assign(user, token)
  }
  return null
}

export async function getUserById(userId: string): Promise<UserInfo> {
  return await userCol.findOne({ _id: new ObjectId(userId) }) as UserInfo
}

export async function verifyUser(email: string) {
  email = email.toLowerCase()
  return await userCol.updateOne({ email }, { $set: { status: Status.Normal, verifyTime: new Date().toLocaleString() } })
}

export async function getConfig(): Promise<Config> {
  return await configCol.findOne() as Config
}

export async function updateConfig(config: Config): Promise<Config> {
  const result = await configCol.replaceOne({ _id: config._id }, config, { upsert: true })
  if (result.modifiedCount > 0 || result.upsertedCount > 0)
    return config
  if (result.matchedCount > 0 && result.modifiedCount <= 0 && result.upsertedCount <= 0)
    return config
  return null
}

export async function createRecharge(userId: string, amount: number, paymentMethod?: string, transactionId?: string, remark?: string) {
  const record = new Recharge(userId, amount, paymentMethod, transactionId, remark)
  const user = await getUser(userId)
  await updateUserInfo(user._id, { ...user, score: Number(user.score) + Number(amount) } as UserInfo)
  await rechargeCol.insertOne(record)
  return record
}

export async function setJWTToken(openid: string, unionid: string, salt: string, accessToken: string) {
  const user = await getUser(unionid)
  if (!user)
    throw new Error('no use')
  const token = jwt.sign({
    email: user.email,
    name: user.name ? user.name : user.email,
    avatar: user.avatar,
    description: user.description,
    userId: user._id,
    vipType: user.vipType,
    vipStart: user.vipStart,
    vipEnd: user.vipEnd,
    openid: user.openid,
    unionid: user.unionid,
    score: user.score,
    status: user.status,
    token: accessToken,
  }, salt)
  return token
}

export async function updateVIPScore(query, update, options) {
  const result = await userCol.updateMany(query, update, options)
  return result
}

export async function insertChatUsage(userId: string, roomId: number, chatId: ObjectId, messageId: string, usage: UsageResponse) {
  const chatUsage = new ChatUsage(userId, roomId, chatId, messageId, usage)
  await usageCol.insertOne(chatUsage)
  return chatUsage
}

export async function getRecharge(unionid: string) {
  return await rechargeCol.find({ userId: unionid }).toArray()
}

export async function getKeyStore() {
  const result = await keyStoreCol.findOne({ status: 'active' })
  return result
}

export async function updateKeyStoreStatus() {
  const result = await keyStoreCol.updateOne({ key: process.env.OPENAI_API_KEY }, { $set: { status: 'expire' } })
  await keyStoreCol.updateOne({ status: 'backup' }, { $set: { status: 'active' } })
  const rest = await getKeyStore()
  process.env.OPENAI_API_KEY = rest.key
  return result
}
