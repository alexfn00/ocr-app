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
    const { _id, company, role, password } = event

    if (!_id) {
      return { success: false, message: '缺少用户ID' }
    }

    const updateData = {
      company,
      role,
      updatedAt: new Date(),
    }
    if (password) {
      updateData.password = hashPassword(password)
    }

    await users.doc(_id).update({
      data: updateData,
    })

    return { success: true, message: '用户更新成功' }
  } catch (e) {
    console.error(e)
    return { success: false, message: '服务器错误' }
  }
}
