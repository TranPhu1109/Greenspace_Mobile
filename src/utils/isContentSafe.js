import { OPENAI_API_KEY } from '@env';

// 🎯 DANH SÁCH TỪ CẤM GỐC (có dấu, dễ đọc)
const rawBadWords = [
    // ✅ Thô tục/chửi bậy phổ biến
    "cứt", "đéo", "lồn", "loz", "cặc", "dái", "địt", "đụ", "đĩ", "đĩ mẹ", "con đĩ", "má mày", "mẹ mày", "cha mày", "vú", "buồi",
    "dâm", "dâm đãng", "cave", "phò", "phò đĩ", "thằng chó", "con chó", "chó má", "óc chó", "ngu như bò", "ngu như lợn", "đần", "vô học",
    "thằng đần", "mất dạy", "vô giáo dục", "cút mẹ mày", "câm mồm", "mẹ kiếp", "thằng khốn", "đồ khốn", "đồ ngu", "óc lợn", "đầu bò", "ngu vl", "vkl", "vl",
  
    // ✅ Lách viết: viết tắt
    "cc", "dm", "dcm", "cl", "clm", "cmm", "vcl", "vkl", "vl", "dkm", "djt", "djtme", "bome", "meo", "ditme", "lon", "dit", "duma", "dmm", "mml", "occho", "oc vit",
  
    // ✅ Miệt thị giới tính
    "bê đê", "pê đê", "bóng lộ", "đồng bóng", "pede", "gay lòi", "bóng lòi", "les", "less", "ái nam ái nữ", "thái giám",
  
    // ✅ Miệt thị dân tộc, vùng miền, văn hóa
    "bắc kỳ", "nam kỳ", "trung kỳ", "miền quê", "dân tộc thiểu số", "mọi rợ", "mọi đen", "mọi trắng", "mọi miền núi", "đồ nhà quê", "ăn lông ở lỗ",
  
    // ✅ Bạo lực, đe doạ
    "tao giết mày", "tao đập mày", "tao cho mày ăn đấm", "tao bóp cổ mày", "tao xiên mày", "tao làm thịt mày", "tao chém mày", "tao đập chết", "giết người", "đâm chết", "tạt axit", "hiếp", "hiếp dâm", "cưỡng hiếp", "dọa giết", "đe doạ",
  
    // ✅ Xúc phạm người yếu thế
    "thằng khùng", "con điên", "bị tâm thần", "não tàn", "dị tật", "khuyết tật", "mù", "đui", "câm", "điếc", "què", "thằng què", "con què",
  
    // ✅ Tự tử, nhạy cảm nặng
    "tự tử", "muốn chết", "chết mẹ đi", "đi chết đi", "bắn vào đầu", "treo cổ", "nhảy lầu", "cắt cổ", "rạch tay", "uống thuốc tự tử"
  ];
  

// ✅ Hàm chuẩn hoá: bỏ dấu, ký tự đặc biệt, thu gọn khoảng trắng
const normalize = (text) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
    .replace(/[^\w\s]|_/g, "")       // bỏ ký tự đặc biệt
    .replace(/\s+/g, " ")            // bỏ khoảng trắng thừa
    .trim();

// ✅ Danh sách từ cấm đã chuẩn hoá (không dấu, không ký tự)
const badWords = rawBadWords.map(normalize);

// ⚡ Kiểm tra từ cấm local
const containsBadWords = (text) => {
  const clean = normalize(text);

  return badWords.some((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i'); // match đúng từ
    return pattern.test(clean);
  });
};

// 🧠 Gọi OpenAI Moderation API để phân tích ngữ cảnh
const checkWithOpenAI = async (text) => {
  const res = await fetch('https://api.openai.com/v1/moderations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ input: text }),
  });

  const data = await res.json();
  const flagged = data.results?.[0]?.flagged || false;
  const categories = data.results?.[0]?.categories || {};

  return { flagged, categories };
};

// ✅ Hàm chính: Kiểm tra nội dung an toàn hay không
export const isContentSafe = async (text) => {
  const result = {
    ok: true,
    reason: '',
    flaggedBy: null,
  };

  // ⚠️ Bước 1: Kiểm tra local bad words
  if (containsBadWords(text)) {
    result.ok = false;
    result.reason = 'Nội dung chứa từ ngữ không phù hợp.';
    result.flaggedBy = 'local';
    return result;
  }

  // 🧠 Bước 2: Gọi OpenAI nếu không có từ tục rõ ràng
  try {
    const { flagged, categories } = await checkWithOpenAI(text);

    if (flagged) {
      result.ok = false;
      result.reason = 'AI phát hiện nội dung không phù hợp.';
      result.flaggedBy = 'openai';
      result.categories = categories;
    }
  } catch (err) {
    console.warn('⚠️ Lỗi gọi OpenAI Moderation:', err.message);
    // Nếu lỗi mạng → cho phép gửi (bạn có thể thay đổi logic này)
  }

  return result;
};
