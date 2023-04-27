import * as dotenv from 'dotenv'
import { MongoClient, ObjectId } from 'mongodb'
import jwt from 'jsonwebtoken'
import { ChatInfo, ChatRoom, Recharge, Status, UserInfo, Token } from './model'
import type { ChatOptions, Config } from './model'

dotenv.config()
console.log(process.env.MONGODB_URL)
const url = process.env.MONGODB_URL
const client = new MongoClient(url)
const chatCol = client.db('chatgpt').collection('chat')
const roomCol = client.db('chatgpt').collection('chat_room')
const userCol = client.db('chatgpt').collection('user')
const configCol = client.db('chatgpt').collection('config')
const rechargeCol = client.db('chatgpt').collection('recharge')
const tokenCol = client.db('chatgpt').collection('token')

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

export async function updateChat(chatId: string, response: string, messageId: string) {
  const query = { _id: new ObjectId(chatId) }
  const update = {
    $set: { 'response': response, 'options.messageId': messageId },
  }
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

export const createUser = async ({ email, password, score, openid, unionid, ...rest }: UserInfo = new UserInfo()): Promise<UserInfo> => {
  const user = await User.findOne({unionid}) as UserInfo
  console.log('user is :', user)
  if (user) {
    // 如果在数据库中找到了用户
    const userInfo = await User.findOneAndUpdate(
      { unionid },
      { $addToSet: { openid }, avatar, name: nickname, verifyTime: new Date().getTime(), status: 0, password: '', email: '' },
      { new: true }
    )
    return userInfo
  } else {
    // 如果没有找到用户，则创建一个新用户
    const userInfo = new User({ openid: [openid], unionid, avatar, name: nickname, score: 10, description: '', verifyTime: new Date().getTime(), status: 0, createTime: new Date().getTime(), password: '', email: '' },{versionKey:false})
    await userInfo.save(userInfo)
    return userInfo
  }
};

export const updateOpenId  = async (openid: string, unionid: string): Promise<UserInfo> => {
    const user = await userCol.findOne({unionid}) as UserInfo
    if (!user) {
       throw new Error('no user')
    }
    // 如果在数据库中找到了用户
    const userInfo = await userCol.findOneAndUpdate({ unionid }, { $addToSet: { openid }}, { new: true })
    return userInfo
}

export async function updateUserInfo(userId: string, user: UserInfo) {
  const result = await userCol.updateOne({ _id: new ObjectId(userId) }
    , { $set: { name: user.name, description: user.description, avatar: user.avatar, score: user.score, status: user.status, password: user.password } })
  return result
}

export async function getUser(emailOrOpenid: string): Promise<UserInfo> {
  if (!emailOrOpenid) {
    throw new Error('Invalid input')
  }
  const isEmail = /\S+@\S+\.\S+/.test(emailOrOpenid)
  const query = isEmail ? { email: emailOrOpenid.toLowerCase() } : { unionid: emailOrOpenid }
  console.log(query)
  const result = await userCol.findOne(query)
  if (!result) {
    return null
  }
  return result as UserInfo
}

export async function getUserByOpenIdAndToken(openid: string, access_token: string): Promise<UserInfo> {
  const user = await userCol.findOne({ openid }) as UserInfo
  const token = await tokenCol.findOne({ access_token, openid }) as Token
  if (token && user)
    return { ...user, ...token }
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
  await configCol.replaceOne({ _id: config._id }, config, { upsert: true })
  return config
}

export async function createRecharge(userId: string, amount: number, paymentMethod?: string, transactionId?: string, remark?: string) {
  const record = new Recharge(userId, amount, paymentMethod, transactionId, remark)
  const user = await getUser(userId)
  await updateUserInfo(user._id, { ...user, score: Number(user.score) + Number(amount) } as UserInfo)
  await rechargeCol.insertOne(record)
  return record
}

export async function setJWTToken (openid: string, unionid: string, salt: string, accessToken: string) {
    const user = await getUser(unionid)
    if (!user) {
        throw new Error('no use')
    }
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
