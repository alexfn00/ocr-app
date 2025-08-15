const cloud = require("wx-server-sdk");
const XLSX = require("xlsx");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME = "excelData";
const TEMPLATE_FILE_ID = "cloud://ocr-oecent-7g72ks3y54a20530.6f63-ocr-oecent-7g72ks3y54a20530-1300275738/template/退书预录入导入模板.xls";

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext();
    const { customerCode, discount, items } = event;
    const returnOrderNo = "";

    // 1. 下载模板文件
    const templateRes = await cloud.downloadFile({
      fileID: TEMPLATE_FILE_ID,
    });
    const templateBuffer = templateRes.fileContent;

    // 2. 读取模板
    const workbook = XLSX.read(templateBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 3. 把模板中的数据转成二维数组
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 4. 查询数据库获取图书信息
    const _ = db.command;
    const promises = items.map(({ isbn }) => {
      return db.collection(COLLECTION_NAME)
        .where(
          _.or([
            { ISBN: isbn },
            { 条码书号: isbn }
          ])
        )
        .limit(1)
        .get();
    });
    const queryResults = await Promise.all(promises);
    // 5. 追加数据（保留模板表头）
    items.forEach(({ isbn, goodCount, badCount }, i) => {
      const bookData = queryResults[i].data[0] || {};
      sheetData.push([
        customerCode,
        isbn,
        bookData.书代号 || "",
        bookData.书名 || "",
        bookData.定价 || "",
        goodCount || 0,
        badCount || 0,
        discount,
        returnOrderNo,
        bookData.版印次 || "",
      ]);
    });

    // 6. 生成新的 worksheet 并替换
    const newWorksheet = XLSX.utils.aoa_to_sheet(sheetData);
    workbook.Sheets[sheetName] = newWorksheet;

    // 7. 写回为 Buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // 8. 上传到云存储
    const fileName = `return_list_${Date.now()}.xlsx`;
    const cloudPath = `excel/${fileName}`;
    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: buffer,
    });

    
    
    const fileID = uploadRes.fileID;
    const urlRes = await cloud.getTempFileURL({ fileList: [fileID] });
    
    await db.collection('returnExcelList').add({
      data: {
        openid: OPENID,
        fileName: urlRes.fileName,
        fileID,
        downloadUrl: urlRes.fileList[0].tempFileURL,
        createdAt: db.serverDate(),
      },
    });
    return {
      success: true,
      fileID,
      downloadUrl: urlRes.fileList[0].tempFileURL,
    };
  } catch (error) {
    console.error("生成退货Excel失败", error);
    return {
      success: false,
      message: error.message,
    };
  }
};
