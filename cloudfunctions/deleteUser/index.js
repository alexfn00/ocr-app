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

    await users.doc(id).remove()

    return { success: true, message: '用户删除成功' }
  } catch (e) {
    console.error(e)
    return { success: false, message: '服务器错误' }
  }
}
