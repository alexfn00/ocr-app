const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const users = db.collection('users')

exports.main = async (event, context) => {
  try {
    const { id } = event
    if (!id) {
      return { success: false, message: '缺少用户ID' }
    }

    const res = await users.doc(id).get()
    if (!res.data) {
      return { success: false, message: '用户不存在' }
    }

    // 不返回密码
    const { password, ...safeData } = res.data

    return { success: true, data: safeData }
  } catch (e) {
    console.error(e)
    return { success: false, message: '服务器错误' }
  }
}
