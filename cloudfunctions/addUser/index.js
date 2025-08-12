const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

exports.main = async (event, context) => {
  try {
    const { phone, company, role, password } = event

    if (!phone || !company || !role || !password) {
      return { success: false, message: '缺少必要字段' }
    }

    // 手机号唯一性校验
    const exists = await users.where({ phone }).get()
    if (exists.data.length > 0) {
      return { success: false, message: '该手机号已存在' }
    }

    const now = new Date()
    const res = await users.add({
      data: {
        phone,
        company,
        role,
        password: hashPassword(password),
        createdAt: now,
        updatedAt: now,
      },
    })

    return { success: true, message: '用户添加成功', data: { _id: res._id } }
  } catch (e) {
    console.error(e)
    return { success: false, message: '服务器错误' }
  }
}
