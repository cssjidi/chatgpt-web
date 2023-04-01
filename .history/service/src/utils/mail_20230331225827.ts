import * as fs from 'fs'
import * as path from 'path'
import nodemailer from 'nodemailer'
import type { MailConfig } from '../storage/model'
import { getCacheConfig } from '../storage/config'

export async function sendVerifyMail(toMail: string, verifyUrl: string) {
  const config = (await getCacheConfig())

  const templatesPath = path.join(__dirname, 'templates')
  const mailTemplatePath = path.join(templatesPath, 'mail.template.html')
  let mailHtml = fs.readFileSync(mailTemplatePath, 'utf8')
  mailHtml = mailHtml.replace(/\${VERIFY_URL}/g, verifyUrl)
  mailHtml = mailHtml.replace(/\${SITE_TITLE}/g, config.siteConfig.siteTitle)
  try {
    sendMail(toMail, `${config.siteConfig.siteTitle} 账号验证`, mailHtml, config.mailConfig)
  }
  catch (err) {
    console.error('Error occurred while sending email:', err)
    throw new Error(`Failed to send email: ${err.message}`)
  }
}

export async function sendTestMail(toMail: string, config: MailConfig) {
  return sendMail(toMail, '测试邮件|Test mail', '这是一封测试邮件|This is test mail', config)
}

async function sendMail(toMail: string, subject: string, html: string, config: MailConfig) {
  const mailOptions = {
    from: config.smtpUserName,
    to: toMail,
    subject,
    html,
  }
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpTsl,
    auth: {
      user: config.smtpUserName,
      pass: config.smtpPassword,
    },
  })
  try {
    const info = await transporter.sendMail(mailOptions)
    return info.messageId
  }
  catch (err) {
    console.error('Error occurred while sending email:', err)
    throw new Error(`Failed to send email: ${err.message}`)
  }
}
