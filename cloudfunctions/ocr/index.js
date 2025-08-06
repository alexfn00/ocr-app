const tencentcloud = require("tencentcloud-sdk-nodejs-ocr");

const OcrClient = tencentcloud.ocr.v20181119.Client;

exports.main = async (event, context) => {
  const clientConfig = {
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: "ap-guangzhou",
    profile: {
      httpProfile: {
        endpoint: "ocr.tencentcloudapi.com",
      },
    },
  };

  const client = new OcrClient(clientConfig);
  const params = {
    ImageBase64: event.imageBase64,
  };

  try {
    const result = await client.GeneralBasicOCR(params);
    const isbn = extractISBN(result.TextDetections);

    return {
      isbn,
      // rawText: result.TextDetections.map(item => item.DetectedText),
      // ...result,
    };
  } catch (e) {
    return { error: e.message };
    }
}


// 封装提取 ISBN 的逻辑
function extractISBN(textDetections) {
  if (!Array.isArray(textDetections)) return null;

  const lines = textDetections.map(item => item.DetectedText);

  for (const line of lines) {
    // 修正常见 OCR 错误
    const normalized = line.replace(/IS8N|I5BN|ISB[NM]/gi, 'ISBN');

    // 尝试匹配 ISBN 格式（带分隔符）
    const hyphenMatch = normalized.match(/ISBN[\s:-]*?((\d{3})[-\s]?\d{1,5}[-\s]?\d{1,7}[-\s]?\d{1,7}[-\s]?\d{1})/i);

    // 或尝试纯数字 13 位（无 ISBN 前缀）
    const plainMatch = normalized.match(/(\d{13})/);

    if (hyphenMatch) {
      const raw = hyphenMatch[1].replace(/\s/g, '');
      const pure = raw.replace(/-/g, '');
      return { formatted: raw, digits: pure };
    }

    if (plainMatch) {
      return { formatted: plainMatch[1], digits: plainMatch[1] };
    }
  }

  return null;
}
