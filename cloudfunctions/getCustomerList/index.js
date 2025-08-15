const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, keyword } = event;

  try {
    const skip = (page - 1) * pageSize;
    let query = db.collection('customers');

    // 只有 keyword 非空时才加模糊搜索
    if (keyword && keyword.trim() !== "") {
      const pattern = `.*${keyword.trim()}.*`;
      query = query.where({
        客户名称: db.RegExp({
          regexp: pattern,
          options: 'i'
        })
      });
    }

    const res = await query
      .skip(skip)
      .limit(pageSize)
      // .field({ _id: true, 客户编码: true, 客户名称: true, 折扣: true })
      .get();

    const totalRes = keyword
      ? await query.count()
      : await db.collection('customers').count();

    return {
      success: true,
      data: res.data,
      total: totalRes.total,
    };
  } catch (e) {
    console.error("getCustomers error:", e);
    return { success: false, message: e.message };
  }
};
