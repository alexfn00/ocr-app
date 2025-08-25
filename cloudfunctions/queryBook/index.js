const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event, context) => {
  const { isbn } = event

  if (!isbn) {
    return {
      code: 400,
      message: '缺少 ISBN',
    }
  }

  try {
    const escapeRegExp = (str) => str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const keyword = escapeRegExp(isbn);
    const res = await db.collection('excelData')
    .where({
      normISBN: db.RegExp({
        regexp: `.*${keyword}.*`,
        options: 'i',
      }),
    })
    .get();

    if (res.data.length > 0) {
      return {
        code: 0,
        data: res.data,
      }
    } else {
      return {
        code: 404,
        message: '未找到对应书籍',
      }
    }
  } catch (error) {
    return {
      code: 500,
      message: '查询失败',
      error: error.message,
    }
  }
}
