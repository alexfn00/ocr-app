const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, keyword } = event;

  try {
    const skip = (page - 1) * pageSize;
    let query = db.collection('publisher');

    // 只有 keyword 非空时才加模糊搜索
    if (keyword && keyword.trim() !== "") {
      const pattern = `.*${keyword.trim()}.*`;
      query = query.where({
        name: db.RegExp({
          regexp: pattern,
          options: 'i'
        })
      });
    }

    const res = await query
      .skip(skip)
      .limit(pageSize)
      .get();

    const totalRes = keyword
      ? await query.count()
      : await db.collection('publisher').count();

    return {
      success: true,
      data: res.data,
      total: totalRes.total,
    };
  } catch (e) {
    console.error("getPublishers error:", e);
    return { success: false, message: e.message };
  }
};
