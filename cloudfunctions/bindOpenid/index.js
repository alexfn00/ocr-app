// cloudfunctions/bindOpenid/index.js
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const { userId, avatarUrl, nickname } = event;
  const { OPENID } = cloud.getWXContext();

  if (!userId) {
    return { success: false, message: "用户ID缺失" };
  }

  // ✅ 检查是否已有其它用户绑定此 openid
  const existing = await db.collection("users")
    .where({ openid: OPENID, _id: _.neq(userId) })
    .get();

  if (existing.data.length > 0) {
    return { success: false, message: "该微信账号已绑定其他手机号" };
  }

  // ✅ 更新用户文档，绑定 openid
  await db.collection("users").doc(userId).update({
    data: {
      openid: OPENID,
      avatarUrl,
      nickname,
    },
  });

  // 返回用户信息
  const user = await db.collection("users").doc(userId).get();

  return { success: true, user: user.data };
};
