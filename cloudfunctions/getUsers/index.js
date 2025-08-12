// cloudfunctions/getUsers/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20 } = event
  try {
    const skip = (page - 1) * pageSize
    const res = await db.collection('users')
      .skip(skip)
      .limit(pageSize)
      .orderBy('phone', 'asc')
      .field({ phone: true, nickname: true, role: true, openid: true, company: true })
      .get()
    const total = await db.collection('users').count()
    return {
      success: true,
      data: res.data,
      total: total.total,
    }
  } catch (e) {
    return { success: false, message: e.message }
  }
}
