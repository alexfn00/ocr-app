// cloudfunctions/getUsers/index.js
const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20 } = event
  try {
    const skip = (page - 1) * pageSize
    const res = await db.collection('returnExcelList')
      .skip(skip)
      .limit(pageSize)
      .orderBy('createdAt', 'desc')
      .field({ _id: true, createdAt: true, downloadUrl: true, fileID: true })
      .get()
    const total = await db.collection('returnExcelList').count()
    return {
      success: true,
      data: res.data,
      total: total.total,
    }
  } catch (e) {
    return { success: false, message: e.message }
  }
}
