// cloudfunctions/unbindOpenid/index.js
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();

  // 查找当前绑定此 openid 的用户
  const res = await db.collection("users").where({ openid: OPENID }).get();

  if (res.data.length === 0) {
    return { success: false, message: "未找到绑定用户" };
  }

  const userId = res.data[0]._id;

  // 解绑
  await db.collection("users").doc(userId).update({
    data: {
      openid: db.command.remove(),
    },
  });

  return { success: true, message: "解绑成功" };
};
