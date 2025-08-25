const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const crypto = require('crypto')
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext();
  const { phone, password } = event;

  if (!phone || !password) {
    return { success: false, message: "手机号和密码不能为空" };
  }

  try {
    // 查找用户

    const hashedInput = hashPassword(password)
    const res = await db.collection("users")
      .where({ phone, password: hashedInput })
      .get();

    if (res.data.length === 0) {
      return { success: false, message: "手机号或密码错误"};
    }

    const user = res.data[0];

    if (user.openid && user.openid !== OPENID) {
      return {
        success: false,
        message: '该手机号已绑定其他微信账号，无法登录:'
      }
    }
    // 检查是否已绑定 openid
    const needBindOpenid = !user.openid;

    return {
      success: true,
      user: {
        _id: user._id,            // 返回用户ID供前端绑定用
        phone: user.phone,
        nickname: user.nickname || "",
        company: user.company || "",
        avatarUrl: user.avatarUrl || "",
        role: user.role || "user",
        openid: user.openid || null,
      },
      needBindOpenid,
    };
  } catch (err) {
    console.error("登录查询失败：", err);
    return { success: false, message: "登录异常，请稍后再试" };
  }
};
