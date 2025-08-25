const cloud = require('wx-server-sdk')
const xlsx = require('xlsx')
const fs = require('fs')
const path = require('path')
const os = require('os')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

// ISBN 统一处理：去掉 "-"
function normalizeISBN(isbn) {
  return isbn ? isbn.replace(/-/g, '').trim() : ''
}

function getISBN(item, publisher) {
  if (publisher == '中国农业大学出版社') {
    return item['书号']
  } else if (publisher == '中国人口出版社') {
    return item['ISBN']
  }
  return null
}

exports.main = async (event, context) => {
  const { fileID, publisher } = event

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

    let headerRow, dataRows
    if (publisher == '中国农业大学出版社') {
      if (rawData.length < 2) {
        return {
          code: 422,
          message: 'Excel 内容不足，至少需要 2 行（含表头）',
        }
      }
      headerRow = rawData[0] // 第1行是表头
      dataRows = rawData.slice(1) // 第2行以后是内容
    } else if (publisher == '中国人口出版社') {
      if (rawData.length < 5) {
        return {
          code: 422,
          message: 'Excel 内容不足，至少需要 5 行（含表头）',
        }
      }
      headerRow = rawData[3] // 第4行是表头
      dataRows = rawData.slice(4) // 第5行以后是内容
    }

    // 组装数据
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

    // 4. 去重（Excel 内部）
    const seen = new Set()
    const uniqueData = []
    for (const item of data) {
      const ISBN = getISBN(item, publisher)
      const normISBN = normalizeISBN(ISBN)
      if (normISBN && seen.has(normISBN)) continue
      if (normISBN) seen.add(normISBN)
      uniqueData.push(item)
    }

    // 5. 插入数据（存在就忽略）
    const db = cloud.database()
    const collection = db.collection('excelData')

    let insertCount = 0
    let skipCount = 0

    for (const item of uniqueData) {
      const ISBN = getISBN(item, publisher)
      const normISBN = normalizeISBN(ISBN)

      if (normISBN) {
        // 查找是否已存在
        const existing = await collection.where({ normISBN }).get()
        if (existing.data.length > 0) {
          // 已存在 → 忽略
          skipCount++
        } else {
          // 不存在 → 添加
          await collection.add({
            data: {
              ...item,
              normISBN, // 存储标准化后的 ISBN
              publisher: publisher || '', // 使用传入的出版社参数
            },
          })
          insertCount++
        }
      } else {
        // 没有 ISBN → 直接插入
        await collection.add({ data: item })
        insertCount++
      }
    }

    return {
      code: 0,
      message: '导入完成',
      insertCount,
      skipCount,
      total: uniqueData.length,
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
