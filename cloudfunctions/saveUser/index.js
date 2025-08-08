// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { avatarUrl, nickname } = event
  const { OPENID } = cloud.getWXContext()

  const users = db.collection('users')
  const now = new Date()

  const record = {
    _openid: OPENID,
    avatarUrl,
    nickname,
    createdAt: now,
  }

  // 如果用户已存在，更新；否则插入
  const res = await users.where({ _openid: OPENID }).get()
  if (res.data.length > 0) {
    await users.where({ _openid: OPENID }).update({ data: record })
  } else {
    await users.add({ data: record })
  }

  return {
    success: true,
    msg: '保存成功',
    data: record
  }
}
