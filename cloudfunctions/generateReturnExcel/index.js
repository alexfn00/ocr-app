const cloud = require("wx-server-sdk");
const XLSX = require("xlsx");

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

const COLLECTION_NAME = "excelData";
const TEMPLATE_RETURN_ID = "cloud://ocr-oecent-7g72ks3y54a20530.6f63-ocr-oecent-7g72ks3y54a20530-1300275738/template/退书预录入导入模版.xlsx"
const TEMPLATE_ORDER_ID = "cloud://ocr-oecent-7g72ks3y54a20530.6f63-ocr-oecent-7g72ks3y54a20530-1300275738/template/订单录入导入模板.xlsx"

function formatDate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${d}_${hh}-${mm}-${ss}`;
}

exports.main = async (event, context) => {
  try {
    const { OPENID } = cloud.getWXContext();
    const { userId, mode, customerCode, customerName, items } = event;
    const discount = 1; // 暂时不需要折扣
    const returnOrderNo = "";

    if (mode != "return" && mode != "order") {
      throw new Error("mode参数错误");
    }
    const comments = "";
    // 1. 下载模板文件
    const templateRes = await cloud.downloadFile({
      fileID: mode == "return" ? TEMPLATE_RETURN_ID : TEMPLATE_ORDER_ID,
    });
    const templateBuffer = templateRes.fileContent;

    // 2. 读取模板
    const workbook = XLSX.read(templateBuffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // 3. 把模板中的数据转成二维数组
    const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // 找到表头行索引（假设第一行非空即为表头）
    const headerRowIndex = sheetData.findIndex(
      (row) => row.some((cell) => cell !== undefined && cell !== null && cell !== "")
    );

    // 数据写入起始行，从表头下一行开始
    const startRowIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : sheetData.length;

    // 4. 查询数据库获取图书信息
    const _ = db.command;
    const promises = items.map(({ isbn }) =>
      db.collection(COLLECTION_NAME)
        .where({ normISBN: isbn })
        .limit(1)
        .get()
    );
    const queryResults = await Promise.all(promises);

    // 5. 插入数据
    items.forEach(({ isbn, count, badCount }, i) => {
      const bookData = queryResults[i]?.data?.[0] || {};
      const row =
        mode === "order"
          ? [
              customerCode,
              isbn,
              bookData.书名 || "",
              count || 0,
              bookData.定价 || "",
              discount,
              comments,
            ]
          : [
              customerCode,
              isbn,
              bookData.书代号 || "",
              bookData.书名 || "",
              bookData.定价 || "",
              count || 0,
              badCount || 0,
              discount,
              returnOrderNo,
              bookData.版印次 || "",
            ];

      // 将行插入到 startRowIndex + i 位置
      sheetData[startRowIndex + i] = row;
    });
    // 6. 生成新的 worksheet 并替换
    const newWorksheet = XLSX.utils.aoa_to_sheet(sheetData);
    workbook.Sheets[sheetName] = newWorksheet;

    // 7. 写回为 Buffer
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    // 8. 上传到云存储
    const cloudPath = `${mode}/${customerName}_${mode === "order" ? "订单" : "退货单"}_${formatDate()}.xlsx`;
    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: buffer,
    });

    const fileID = uploadRes.fileID;
    const urlRes = await cloud.getTempFileURL({ fileList: [fileID] });
    
    await db.collection('returnExcelList').add({
      data: {
        openid: OPENID,
        userId,
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
