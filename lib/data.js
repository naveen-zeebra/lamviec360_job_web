export const FILTER_VI = {
  "Full-time": "Toàn thời gian",
  Remote: "Từ xa",
  "Part-time": "Bán thời gian",
  Contract: "Hợp đồng",
  Internship: "Thực tập",
};

import { allCountries } from "country-telephone-data";

export function getFlagEmoji(iso2) {
  if (!iso2) return "🌐";
  return iso2
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt()));
}

const PRIORITY_ISOS = ["vn", "us", "sg", "jp", "kr", "gb", "au", "in", "de", "fr", "cn", "th", "my", "ph", "id", "tw", "hk", "ae"];

const priorityCountries = PRIORITY_ISOS
  .map((iso) => allCountries.find((c) => c.iso2 === iso))
  .filter(Boolean);

const otherCountries = allCountries
  .filter((c) => !PRIORITY_ISOS.includes(c.iso2))
  .sort((a, b) => a.name.localeCompare(b.name));

export const COUNTRY_CODES = [...priorityCountries, ...otherCountries].map((c) => ({
  iso: c.iso2.toUpperCase(),
  code: `+${c.dialCode}`,
  name: c.name.replace(/\s*\(.*\)/, "").trim(),
  flag: getFlagEmoji(c.iso2),
}));


export const RESOURCES = [
  { cat: ["Hồ sơ", "Profile"], title: ["Xây dựng hồ sơ nổi bật với nhà tuyển dụng", "Build a profile recruiters notice"], desc: ["Cách trình bày kinh nghiệm, kỹ năng và thành tích để hồ sơ của bạn dễ đọc và dễ so khớp.", "How to present experience, skills and achievements so your profile is easy to read and easy to match."], read: ["6 phút đọc", "6 min read"] },
  { cat: ["Phỏng vấn", "Interviews"], title: ["Chuẩn bị cho vòng phỏng vấn đầu tiên", "Preparing for a first-round interview"], desc: ["Những câu hỏi thường gặp và cách cấu trúc câu trả lời của bạn theo tình huống cụ thể.", "Common questions and how to structure your answers around concrete situations."], read: ["8 phút đọc", "8 min read"] },
  { cat: ["Lương", "Salary"], title: ["Thảo luận về mức lương một cách chuyên nghiệp", "Discussing salary professionally"], desc: ["Cách nghiên cứu mức lương thị trường và trao đổi kỳ vọng của bạn một cách rõ ràng.", "How to research market ranges and communicate your expectations clearly."], read: ["5 phút đọc", "5 min read"] },
  { cat: ["Ứng tuyển", "Applying"], title: ["Viết thư ứng tuyển ngắn và hiệu quả", "Writing a short, effective cover note"], desc: ["Một ghi chú ngắn gọn giải thích lý do bạn phù hợp thường hiệu quả hơn một lá thư dài.", "A brief note explaining why you fit usually works better than a long letter."], read: ["4 phút đọc", "4 min read"] },
  { cat: ["Nghề nghiệp", "Career"], title: ["Chuyển đổi ngành nghề: bắt đầu từ đâu", "Changing industries: where to start"], desc: ["Xác định kỹ năng có thể chuyển đổi và cách trình bày chúng cho một lĩnh vực mới.", "Identify transferable skills and how to frame them for a new field."], read: ["7 phút đọc", "7 min read"] },
  { cat: ["Từ xa", "Remote"], title: ["Làm việc từ xa hiệu quả tại Việt Nam", "Working remotely, effectively"], desc: ["Thiết lập thói quen, giao tiếp và kỳ vọng khi làm việc từ xa hoặc kết hợp.", "Setting routines, communication and expectations in remote or hybrid roles."], read: ["6 phút đọc", "6 min read"] },
];
