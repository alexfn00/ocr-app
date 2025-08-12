const cloud = require("wx-server-sdk");
const XLSX = require("xlsx");

cloud.init();
const db = cloud.database();

const COLLECTION_NAME = "excelData";

exports.main = async (event, context) => {
  try {
    // 只从 event 读取 items，默认值写死
    const items = event.items || [];
    const customerCode = "默认客户编码"; // 默认客户编码
    const discount = 1; // 默认折扣
    const returnOrderNo = ""; // 默认退单号
    const edition = ""; // 默认版印次

    const header = [
      "客户编码",
      "ISBN(条码号/书代号)",
      "客户书号",
      "书名",
      "定价",
      "好书数",
      "残书数",
      "折扣",
      "退单号",
      "版印次",
    ];

    // 查询图书信息
    const promises = items.map(({ isbn }) =>
      db.collection(COLLECTION_NAME).where({ ISBN: isbn }).limit(1).get()
    );
    const queryResults = await Promise.all(promises);

    const data = items.map(({ isbn, goodCount, badCount }, i) => {
      const bookData = queryResults[i].data[0] || {};
      return [
        customerCode,
        isbn,
        bookData.客户书号 || "",
        bookData.书名 || "",
        bookData.定价 || "",
        goodCount || 0,
        badCount || 0,
        discount,
        returnOrderNo,
        edition,
      ];
    });

    const worksheetData = [header, ...data];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "退货单");
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "buffer" });

    const fileName = `return_list_${Date.now()}.xlsx`;
    const cloudPath = `excel/${fileName}`;

    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: wbout,
    });

    const fileID = uploadRes.fileID;
    const urlRes = await cloud.getTempFileURL({ fileList: [fileID] });

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
