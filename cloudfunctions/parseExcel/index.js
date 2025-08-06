const cloud = require('wx-server-sdk')
const xlsx = require('xlsx')
const fs = require('fs')
const path = require('path')
const os = require('os')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV, // ✅ 使用当前环境
})

exports.main = async (event, context) => {
  const { fileID } = event

  if (!fileID) {
    return {
      code: 400,
      message: '缺少参数 fileID',
    }
  }

  try {
    // 1. 下载文件
    const res = await cloud.downloadFile({ fileID })
    const buffer = res.fileContent

    // 2. 保存临时文件
    const tempFilePath = path.join(os.tmpdir(), `temp-${Date.now()}.xlsx`)
    fs.writeFileSync(tempFilePath, buffer)

    // 3. 读取 Excel
    const workbook = xlsx.readFile(tempFilePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (rawData.length < 5) {
      return {
        code: 422,
        message: 'Excel 内容不足，至少需要 5 行（含表头）',
      }
    }

    const headerRow = rawData[3] // 第4行是表头
    const dataRows = rawData.slice(4) // 第5行以后是内容

    const data = dataRows
      .map((row) => {
        const record = {}
        headerRow.forEach((key, index) => {
          record[key] = row[index] ?? ''
        })
        return record
      })
      .filter((item) => Object.values(item).some((v) => v !== ''))

    if (data.length === 0) {
      return {
        code: 422,
        message: '没有有效数据行',
      }
    }

    // 4. 插入或更新数据
    const db = cloud.database()
    const collection = db.collection('excelData')

    let insertCount = 0
    let updateCount = 0

    for (const item of data) {
      const isbn = item.ISBN?.trim()

      if (isbn) {
        // 查找是否已存在该 ISBN
        const existing = await collection.where({ ISBN: isbn }).get()
        if (existing.data.length > 0) {
          // 存在 → 更新
          const docId = existing.data[0]._id
          await collection.doc(docId).update({ data: item })
          updateCount++
        } else {
          // 不存在 → 添加
          await collection.add({ data: item })
          insertCount++
        }
      } else {
        // 没有 ISBN，直接添加
        await collection.add({ data: item })
        insertCount++
      }
    }

    return {
      code: 0,
      message: '导入完成',
      insertCount,
      updateCount,
      total: data.length,
    }

  } catch (error) {
    console.error('导入异常:', error)
    return {
      code: 500,
      message: '导入失败',
      error: error.message,
    }
  }
}
