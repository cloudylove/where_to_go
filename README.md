# 綠色運輸整合查詢地圖
以高雄市為例，在地圖上整合公車、公共自行車、捷運、輕軌等綠色運輸工具，供使用者做轉乘規劃時查詢。
- 公車：查詢站位、點擊站位的通過路線及到站時刻。
- Youbike：查詢站位、點擊站位的服務狀態及車輛數。
- 捷運：查詢站位。
- 輕軌：查詢站位。

## 圖例
- 藍圈：友善步行範圍。以 800 公尺為基準，約步行 10 分鐘距離。
- 紅圈：捷運紅線車站。
- 橘圈：捷運橘線車站。
- 綠圈：環狀輕軌車站。
- 藍標：公車站位。
- 綠標：Youbike 站點正常租借。
- 橘標：Youbike 站點無車可借。
- 紅標：Youbike 站點車位滿載。
- 灰標：Youbike 站點暫停營運。
- 閃電：Youbike 站點有 2.0E 電輔車。

## 呼叫 API
```
// config.js
const CLIENT_ID = "XXXXXXXXXX-XXXXXXXX-XXXX-XXXX";
const CLIENT_SECRET = "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX";
export { CLIENT_ID, CLIENT_SECRET };
```
1. 請勿將金鑰或任何機敏資訊 push 至 Git Server，可透過`.gitignore`等方式避免。
2. 請使用金鑰驗證得以使用完整功能。
3. 若未成功驗證金鑰，目前僅能使用 TDX API 的【基礎】服務，且每個呼叫來源端 IP 的上限為每日 50 次。