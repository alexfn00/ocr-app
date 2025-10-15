const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { page = 1, pageSize = 20, keyword, publisher } = event;

  try {
    if (!publisher || publisher.trim() === "") {
      return {
        success: false,
        message: "缺少出版社参数",
      };
    }
    const skip = (page - 1) * pageSize;
    const conditions = { publisher: publisher };
    if (keyword && keyword.trim() !== "") {
      conditions['publisher'] = db.RegExp({
        regexp: `.*${keyword.trim()}.*`,
        options: 'i'
      });
    }


    const res = await db.collection('customers')
      .where(conditions)
      .skip(skip)
      .limit(pageSize)
      .get();

     const totalRes = await db.collection('customers')
      .where(conditions)
      .count();

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
