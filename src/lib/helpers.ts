export function trimText(input: string, maxLength: number = 100): string {
  if (input.length <= maxLength) return input;
  return input.substring(0, maxLength - 3) + "...";
}

export function getCurrentTimeInJapan(): Date {
  // 現在のUTC時間を持つDateオブジェクトを作成
  const now = new Date();

  // UTC時間を日本時間に変換
  const offsetJapan = 9; // 日本標準時 (JST) は UTC+9
  now.setHours(now.getUTCHours() + offsetJapan);

  return now;
}

export function formatTimeForJapan(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // これにより、12時間制でAM/PMが表示されます
    timeZone: "Asia/Tokyo",
  };

  let formattedTime = new Intl.DateTimeFormat("ja-JP", options).format(date);

  // タイムゾーン略語を追加
  formattedTime += " JST";

  return formattedTime;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
