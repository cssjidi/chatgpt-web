import express from 'express'
import jwt from 'jsonwebtoken'
import * as dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
import type { RequestProps } from './types'
import type { ChatContext, ChatMessage } from './chatgpt'
import { chatConfig, chatReplyProcess, currentModel, initApi } from './chatgpt'
import { auth } from './middleware/auth'
import { clearConfigCache, getCacheConfig, getOriginConfig } from './storage/config'
import type { ChatOptions, Config, MailConfig, SiteConfig, UserInfo } from './storage/model'
import { Status } from './storage/model'
import { clearChat, createChatRoom, createRecharge, createUser, deleteAllChatRooms, deleteChat, deleteChatRoom, existsChatRoom, getChat, getChatRooms, getChats, getUser, getUserById, insertChat, renameChatRoom, updateChat, updateConfig, updateUserInfo, verifyUser, getUserByOpenIdAndToken, getToken, setToken, setJWTToken } from './storage/mongo'
import { limiter } from './middleware/limiter'
import { isEmail, isNotEmptyString } from './utils/is'
import { sendCodeMail, sendTestMail, sendVerifyMail } from './utils/mail'
import { checkUserVerify, getUserVerifyUrl, md5 } from './utils/security'
import { rootAuth } from './middleware/rootAuth'
import { NO_CHATS } from './const'
const OAuth = require('co-wechat-oauth');

dotenv.config()

const app = express()
const router = express.Router()

const correctCodes = new Map<string, string>()
const client = new OAuth(process.env.appid, process.env.secret)

app.use(express.static('public'))
app.use(express.json())

app.all('*', (_, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'authorization, Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  next()
})

router.get('/chatrooms', auth, async (req, res) => {
  try {
    const userId = req.headers.userId as string
    const rooms = await getChatRooms(userId)
    const result = []
    rooms.forEach((r) => {
      result.push({
        uuid: r.roomId,
        title: r.title,
        isEdit: false,
      })
    })
    res.send({ status: 'Success', message: null, data: result })
  }
  catch (error) {
    console.error(error)
    res.send({ status: 'Fail', message: 'Load error', data: [] })
  }
})

router.post('/room-create', auth, async (req, res) => {
  try {
    const userId = req.headers.userId as string
    const { title, roomId } = req.body as { title: string; roomId: number }
    const room = await createChatRoom(userId, title, roomId)
    res.send({ status: 'Success', message: null, data: room })
  }
  catch (error) {
    console.error(error)
    res.send({ status: 'Fail', message: 'Create error', data: null })
  }
})

router.post('/room-rename', auth, async (req, res) => {
  try {
    const userId = req.headers.userId as string
    const { title, roomId } = req.body as { title: string; roomId: number }
    const room = await renameChatRoom(userId, title, roomId)
    res.send({ status: 'Success', message: null, data: room })
  }
  catch (error) {
    console.error(error)
    res.send({ status: 'Fail', message: 'Rename error', data: null })
  }
})

router.post('/room-delete', auth, async (req, res) => {
  try {
    const userId = req.headers.userId as string
    const { roomId } = req.body as { roomId: number }
    if (!roomId || !await existsChatRoom(userId, roomId)) {
      res.send({ status: 'Fail', message: 'Unknow room', data: null })
      return
    }
    await deleteChatRoom(userId, roomId)
    res.send({ status: 'Success', message: null })
  }
  catch (error) {
    console.error(error)
    res.send({ status: 'Fail', message: 'Delete error', data: null })
  }
})

router.get('/chat-hisroty', auth, async (req, res) => {
  try {
    const userId = req.headers.userId as string
    const roomId = +req.query.roomId
    const lastId = req.query.lastId as string
    if (!roomId || !await existsChatRoom(userId, roomId)) {
      res.send({ status: 'Success', message: null, data: [] })
      // res.send({ status: 'Fail', message: 'Unknow room', data: null })
      return
    }
    const chats = await getChats(roomId, !isNotEmptyString(lastId) ? null : parseInt(lastId))

    const result = []
    chats.forEach((c) => {
      if (c.status !== Status.InversionDeleted) {
        result.push({
          uuid: c.uuid,
          dateTime: new Date(c.dateTime).toLocaleString(),
          text: c.prompt,
          inversion: true,
          error: false,
          conversationOptions: null,
          requestOptions: {
            prompt: c.prompt,
            options: null,
          },
        })
      }
      if (c.status !== Status.ResponseDeleted) {
        result.push({
          uuid: c.uuid,
          dateTime: new Date(c.dateTime).toLocaleString(),
          text: c.response,
          inversion: false,
          error: false,
          loading: false,
          conversationOptions: {
            parentMessageId: c.options.messageId,
          },
          requestOptions: {
            prompt: c.prompt,
            parentMessageId: c.options.parentMessageId,
          },
        })
      }
    })
    res.send({ status: 'Success', message: null, data: result.length > 0 ? result : NO_CHATS })
  }
  catch (error) {
    console.error(error)
    res.send({ status: 'Fail', message: 'Load error', data: null })
  }
})

router.post('/chat-delete', auth, async (req, res) => {
  try {
    const userId = req.headers.userId as string
    const { roomId, uuid, inversion } = req.body as { roomId: number; uuid: number; inversion: boolean }
    if (!roomId || !await existsChatRoom(userId, roomId)) {
      res.send({ status: 'Fail', message: 'Unknow room', data: null })
      return
    }
    await deleteChat(roomId, uuid, inversion)
    res.send({ status: 'Success', message: null, data: null })
  }
  catch (error) {
    console.error(error)
    res.send({ status: 'Fail', message: 'Delete error', data: null })
  }
})

router.post('/chat-clear-all', auth, async (req, res) => {
  try {
    const userId = req.headers.userId as string
    await deleteAllChatRooms(userId)
    res.send({ status: 'Success', message: null, data: null })
  }
  catch (error) {
    console.error(error)
    res.send({ status: 'Fail', message: 'Delete error', data: null })
  }
})

router.post('/chat-clear', auth, async (req, res) => {
  try {
    const userId = req.headers.userId as string
    const { roomId } = req.body as { roomId: number }
    if (!roomId || !await existsChatRoom(userId, roomId)) {
      res.send({ status: 'Fail', message: 'Unknow room', data: null })
      return
    }
    await clearChat(roomId)
    res.send({ status: 'Success', message: null, data: null })
  }
  catch (error) {
    console.error(error)
    res.send({ status: 'Fail', message: 'Delete error', data: null })
  }
})

router.post('/chat', auth, async (req, res) => {
  try {
    const { roomId, uuid, regenerate, prompt, options = {} } = req.body as
      { roomId: number; uuid: number; regenerate: boolean; prompt: string; options?: ChatContext }
    const message = regenerate
      ? await getChat(roomId, uuid)
      : await insertChat(uuid, prompt, roomId, options as ChatOptions)
    const response = await chatReply(prompt, options)
    if (response.status === 'Success')
      await updateChat(message._id, response.data.text, response.data.id)
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/chat-process', [auth, limiter], async (req, res) => {
  const token = jwt.decode(req.headers.authorization.replace(/^Bearer\s+/, '')) as { userId: string }
  const user = await getUserById(token.userId)
  let { status, score } = user
  score = Math.max(score - 1, 0)
  if (score === 0 && user.email.toLowerCase() !== process.env.ROOT_USER) {
    status = Status.NoScore
    await updateUserInfo(token.userId, { ...user, score, status } as UserInfo)
    res.send({ id: '200', text: '当前账户没有积分|No points', parentMessageId: '200' })
    return
  }
  res.setHeader('Content-type', 'application/octet-stream')
  try {
    const { roomId, uuid, regenerate, prompt, options = {}, systemMessage } = req.body as RequestProps
    const message = regenerate
      ? await getChat(roomId, uuid)
      : await insertChat(uuid, prompt, roomId, options as ChatOptions)
    let firstChunk = true
    const result = await chatReplyProcess({
      message: prompt,
      lastContext: options,
      process: (chat: ChatMessage) => {
        res.write(firstChunk ? JSON.stringify(chat) : `\n${JSON.stringify(chat)}`)
        firstChunk = false
      },
      systemMessage,
    })
    if (result.status === 'Success') {
      await updateUserInfo(token.userId, { ...user, score, status } as UserInfo)
      await updateChat(message._id, result.data.text, result.data.id)
    }
  }
  catch (error) {
    res.write(JSON.stringify(error))
  }
  finally {
    res.end()
  }
})

router.post('/user-register', async (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string }
    const config = await getCacheConfig()
    if (!config.siteConfig.registerEnabled) {
      res.send({ status: 'Fail', message: '注册账号功能未启用 | Register account is disabled!', data: null })
      return
    }
    if (!isEmail(username)) {
      res.send({ status: 'Fail', message: '请输入正确的邮箱 | Please enter a valid email address.', data: null })
      return
    }
    if (isNotEmptyString(config.siteConfig.registerMails)) {
      let allowSuffix = false
      const emailSuffixs = config.siteConfig.registerMails.split(',')
      for (let index = 0; index < emailSuffixs.length; index++) {
        const element = emailSuffixs[index]
        allowSuffix = username.toLowerCase().endsWith(element)
        if (allowSuffix)
          break
      }
      if (!allowSuffix) {
        res.send({ status: 'Fail', message: '该邮箱后缀不支持 | The email service provider is not allowed', data: null })
        return
      }
    }

    const user = await getUser(username)
    if (user != null) {
      res.send({ status: 'Fail', message: '邮箱已存在 | The email exists', data: null })
      return
    }
    const newPassword = md5(password + process.env.PASSWORD_MD5_SALT)
    await createUser({ email: username, password: newPassword, score: 10 } as UserInfo)

    if (username.toLowerCase() === process.env.ROOT_USER) {
      res.send({ status: 'Success', message: '注册成功 | Register success', data: null })
    }
    else {
      await sendVerifyMail(username, await getUserVerifyUrl(username))
      res.send({ status: 'Success', message: '注册成功, 去邮箱中验证吧 | Registration is successful, you need to go to email verification', data: null })
    }
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/config', auth, async (req, res) => {
  try {
    const userId = req.headers.userId.toString()

    const user = await getUserById(userId)
    if (user == null || user.status !== Status.Normal || user.email.toLowerCase() !== process.env.ROOT_USER)
      throw new Error('无权限 | No permission.')

    const response = await chatConfig()
    res.send(response)
  }
  catch (error) {
    res.send(error)
  }
})

router.post('/session', async (req, res) => {
  try {
    const config = await getCacheConfig()
    const hasAuth = config.siteConfig.loginEnabled
    const allowRegister = (await getCacheConfig()).siteConfig.registerEnabled
    res.send({ status: 'Success', message: '', data: { auth: hasAuth, allowRegister, model: currentModel() } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/user-login', async (req, res) => {
  try {
    const { username, password } = req.body as { username: string; password: string }
    if (!username || !password || !isEmail(username))
      throw new Error('哎呀，好像出了一些问题！请检查您的用户名和密码是否正确。')

    const user = await getUser(username)
    // 将不允许登录的用户状态存储到数组中
    const disallowedStatus = [Status.Deleted, Status.InversionDeleted, Status.ResponseDeleted]
    // 检查当前用户是否可以登录
    if (!user || user.password !== md5(password + process.env.PASSWORD_MD5_SALT))
      throw new Error('哎呀，好像出了一些问题！请检查您的用户名和密码是否正确。')
    else if (disallowedStatus.includes(user.status))
      throw new Error('用户无法登录，请联系管理员')
    else if (user.status === Status.PreVerify)
      throw new Error('请去邮箱中验证')
    else if (user.status === Status.AdminVerify)
      throw new Error('请等待管理员开通')

    const config = await getCacheConfig()
    const token = jwt.sign({
      email: user.email,
      name: user.name ? user.name : user.email,
      avatar: user.avatar,
      description: user.description,
      userId: user._id,
      score: user.score,
      Status: user.status,
      root: username.toLowerCase() === process.env.ROOT_USER,
    }, config.siteConfig.loginSalt.trim())
    res.send({ status: 'Success', message: '登录成功', data: { token } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/user-info', auth, async (req, res) => {
  try {
    const { name, avatar, description, score } = req.body as UserInfo
    const userId = req.headers.userId.toString()

    const user = await getUserById(userId)
    if (user == null || user.status !== Status.Normal)
      throw new Error('用户不存在 | User does not exist.')
    await updateUserInfo(userId, { ...user, name, avatar, description, score } as UserInfo)
    res.send({ status: 'Success', message: '更新成功 | Update successfully' })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/recharge', rootAuth, async (req, res) => {
  try {
    const { email, score } = req.body as UserInfo
    const user = await getUser(email)
    if (user == null || user.status !== Status.Normal)
      throw new Error('用户不存在 | User does not exist.')
    await updateUserInfo(user._id, { ...user, score } as UserInfo)
    res.send({ status: 'Success', message: '更新成功 | Update successfully' })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body as { token: string }
    if (!token)
      throw new Error('Secret key is empty')
    const username = await checkUserVerify(token)
    await verifyUser(username)
    res.send({ status: 'Success', message: '验证成功 | Verify successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/setting-base', rootAuth, async (req, res) => {
  try {
    const { apiKey, apiModel, apiBaseUrl, accessToken, timeoutMs, socksProxy, socksAuth, httpsProxy } = req.body as Config

    if (apiKey == null && accessToken == null)
      throw new Error('Missing OPENAI_API_KEY or OPENAI_ACCESS_TOKEN environment variable.')

    const thisConfig = await getOriginConfig()
    thisConfig.apiKey = apiKey
    thisConfig.apiModel = apiModel
    thisConfig.apiBaseUrl = apiBaseUrl
    thisConfig.accessToken = accessToken
    thisConfig.timeoutMs = timeoutMs
    thisConfig.socksProxy = socksProxy
    thisConfig.socksAuth = socksAuth
    thisConfig.httpsProxy = httpsProxy
    await updateConfig(thisConfig)
    clearConfigCache()
    initApi()
    const response = await chatConfig()
    res.send({ status: 'Success', message: '操作成功 | Successfully', data: response.data })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/setting-site', rootAuth, async (req, res) => {
  try {
    const config = req.body as SiteConfig

    const thisConfig = await getOriginConfig()
    thisConfig.siteConfig = config
    const result = await updateConfig(thisConfig)
    clearConfigCache()
    res.send({ status: 'Success', message: '操作成功 | Successfully', data: result.siteConfig })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/setting-mail', rootAuth, async (req, res) => {
  try {
    const config = req.body as MailConfig

    const thisConfig = await getOriginConfig()
    thisConfig.mailConfig = config
    const result = await updateConfig(thisConfig)
    clearConfigCache()
    res.send({ status: 'Success', message: '操作成功 | Successfully', data: result.mailConfig })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.post('/mail-test', rootAuth, async (req, res) => {
  try {
    const config = req.body as MailConfig
    const userId = req.headers.userId as string
    const user = await getUserById(userId)
    await sendTestMail(user.email, config)
    res.send({ status: 'Success', message: '发送成功 | Successfully', data: null })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

// 发送验证码接口
router.post('/send-code', async (req, res) => {
  const { email } = req.body
  // 生成验证码
  const code = uuidv4().substr(0, 6)
  // 发送邮件
  // 存储正确的验证码
  correctCodes.set(email, code)
  sendCodeMail(email, code)
  res.send({ status: 'Success', message: '验证码发送成功，请到邮箱查看验证码' })
})

// 修改密码接口
router.post('/reset-password', async (req, res) => {
  try {
    const { email, password, code } = req.body
    const correctCode = correctCodes.get(email)
    if (correctCode !== code) {
      res.send({ status: 'Fail', message: '验证码不正确' })
      return
    }
    const user = await getUser(email)
    if (user == null || user.status === Status.PreVerify) {
      res.send({ status: 'Fail', message: '用户不存在或账户未激活' })
      return
    }
    const newPassword = md5(password + process.env.PASSWORD_MD5_SALT)
    await updateUserInfo(user._id, { ...user, password: newPassword } as UserInfo)
    res.send({ status: 'Success', message: '更改成功 | Update successfully' })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

// 充值表
router.post('/payment', rootAuth, async (req, res) => {
  try {
    const { email, amount, paymentMethod, transactionId, remark } = req.body
    const user = await getUser(email)
    if (user == null || user.status === Status.PreVerify)
      throw new Error('用户不存在或账户未激活')
    await createRecharge(email, amount, paymentMethod, transactionId, remark)
    res.send({ status: 'Success', message: '充值成功 | Update successfully' })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})


const checkTokenValidity = (tokenFromDb) => {
  const { access_token, expires_in, create_at } = tokenFromDb;
  console.log(access_token, expires_in, create_at)
  // 计算AccessToken的过期时间
  const expirationTime = new Date(create_at).getTime() + (expires_in * 1000);
  console.log(`当前时间：${new Date()},过期时间：${new Date(expirationTime)}`)
  // 判断AccessToken是否过期
  if (new Date().getTime() < expirationTime) {
    // AccessToken未过期，可以直接使用
    console.log(`AccessToken: ${access_token}`);
    return true;
  } else {
    // AccessToken已过期，需要手动刷新
    return false;
  }
}
// 微信登陆
router.post('/wechat/login', async (req, res) => {
  try {
    const { uuid } = req.body
    const rest = uuid.split('.')
    const user = await getUserByOpenIdAndToken(rest[0], rest[1])
    if (!user)
      throw new Error('登陆失败，请重新扫码登陆')
    if (!checkTokenValidity(user))
      throw new Error('登陆失败，请重新扫码登陆')
    const config = await getCacheConfig()
    const token = jwt.sign({
      email: user.email,
      name: user.name ? user.name : user.email,
      avatar: user.avatar,
      description: user.description,
      userId: user._id,
      score: user.score,
      Status: user.status,
    }, config.siteConfig.loginSalt.trim())
    res.send({ status: 'Success', message: '登录成功', data: { token } })
  }
  catch (error) {
    res.send({ status: 'Fail', message: error.message, data: null })
  }
})

router.get('/auth', (req, res) => {
  const url = client.getAuthorizeURLForWebsite(process.env.callbackURL)
  res.send({ status: 'Success', message: '微信扫码登陆', data: url })
});

router.get('/callback', async (req, res) => {
  const code = req.query.code

  try {
    const result = await client.getAccessToken(code)
    const tokens = result.data
    const { access_token, openid, refresh_token } = tokens

    let responseToken = access_token
    let user = await getUser(openid)

    // 从数据库中获取token
    const tokenFromDb = await getToken(openid)

    if (!tokenFromDb) {
      // 如果没有注册，调用此方法
      console.log('no token in database')

      const userInfo = await client.getUser(openid)
      const { headimgurl, nickname } = userInfo
      const avatar = headimgurl

      user = await createUser({ openid, avatar, name: nickname, score: 10 } as UserInfo)
      await setToken({openid,...tokens})
    }
    else {
      //检查access_token是否过期
      console.log('token from database', tokenFromDb)
      const accessTokenIsValid = await checkTokenValidity(tokenFromDb)

      if (!accessTokenIsValid) {
        console.log('token expired')
        // 如果access_token过期，使用refresh_token刷新
        const refreshResult = await client.refreshAccessToken(refresh_token)
        responseToken = refreshResult.data.access_token
        await setToken({ openid, ...refreshResult.data })
      }
      else {
        responseToken = tokenFromDb.access_token
        console.log(`if no expired,use old token:${tokenFromDb.access_token}`)
      }
    }
    const config = await getCacheConfig()
    const token = await setJWTToken(openid, config.siteConfig.loginSalt.trim(), responseToken)

    console.log(`jwtToken:${token}`)
    res.redirect(`https://dev.51chat.ai/#/wechat/login?token=${token}`)
  }
  catch (error) {
    console.error(error)
    res.send('Error')
  }
})

app.use('', router)
app.use('/api', router)
app.set('trust proxy', 1)

app.listen(3002, () => globalThis.console.log('Server is running on port 3002'))
