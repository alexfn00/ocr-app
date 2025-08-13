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
    
    const { fileId } = event;
    if (!fileId) {
      return { success: false, message: "缺少 fileID 参数" };
    }

    // 删除云文件
    // await cloud.deleteFile({ fileList: [fileId] });

    // 删除数据库记录
    const delRes = await db.collection('returnExcelList').where({ _id:fileId }).remove();

    return { success: true, message: "删除成功", deletedCount: delRes.stats.removed };
  } catch (err) {
    console.error(err);
    return { success: false, message: err.message || "删除失败" };
  }
};
