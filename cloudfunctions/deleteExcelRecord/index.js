// cloudfunctions/deleteExcelRecord/index.js
const cloud = require("wx-server-sdk");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV, // 使用当前云环境
});

const db = cloud.database();

/**
 * event: { fileID: string }
 */
exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext();

    const { recordId, fileID } = event;
    if (!recordId || !fileID) {
      console.error("缺少必要参数：recordId 或 fileID");
      return { success: false, message: "缺少必要参数：recordId 或 fileID" };
    }

    // 删除云文件
    await cloud.deleteFile({ fileList: [fileID] });

    // 删除数据库记录
    const delRes = await db.collection('returnExcelList').where({ _id: recordId, openid: OPENID }).remove();

    return { success: true, message: "删除成功", deletedCount: delRes.stats.removed };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message || "删除失败" };
  }
};
