// map
var osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap'
});
var map = L.map('map', { layers: [osm] });

map.locate({setView: true, maxZoom: 20}); // 偵測定位
map.on('locationfound', onLocationFound); // 定位成功
map.on('locationerror', onLocationError); // 定位失敗

// 定位成功
async function onLocationFound(e) {
  // let latlng = { lat: 22.6688753, lng: 120.3005317 }; // Kaohsiung Arena
  let latlng = e.latlng; // 取得定位
  let radius = 800; // 步行範圍
  L.circle(latlng, radius).addTo(map); // 標示步行 10min 範圍方圓 800m

  let token = await GetAuthorizationHeader(); // 取得 token
  // call function
  bike(token); // 自行車
}

// 定位失敗訊息
function onLocationError(e) {
  alert(e.message);
}



// 找自行車
async function bike(token){
    // 車站 & 各站車輛 api
    let stn_api = 'https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/Kaohsiung?%24format=JSON';
    let bike_api = 'https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/Kaohsiung?%24format=JSON';
    // 呼叫 TDX api
    let stn_data = await GetApiResponse(stn_api, token);
    let bike_data = await GetApiResponse(bike_api, token);
    // 宣告物件存值方便取用
    let stn_obj;
    let bike_obj;
    let bikeStopArr = []; // 存自行車站 marker
    
    // 處理每個車站的資料
    stn_data.forEach(s_item => {
      stn_obj = {
        PositionLon: s_item.StationPosition.PositionLon, //經度
        PositionLat: s_item.StationPosition.PositionLat, //緯度
        StationName: s_item.StationName.Zh_tw, //站名
        StationAddress: s_item.StationAddress.Zh_tw, //地址
        BikesCapacity: s_item.BikesCapacity, //車位總數
      }
      // 處理各站車輛資料
      bike_data.filter((b_item, index, array) => {
        // 兩組資料透過 StationUID 連結
        if(b_item.StationUID === s_item.StationUID){
          // console.log(`${b_item.StationUID} yes`);
          bike_obj = {
            "Rent": b_item.AvailableRentBikes, //可借車輛數
            "Return": b_item.AvailableReturnBikes, //可還車位數
            "General": b_item.AvailableRentBikesDetail.GeneralBikes, //2.0 車輛數
            "Electric": b_item.AvailableRentBikesDetail.ElectricBikes, //2.0E 車輛數
            "ServiceStatus": b_item.ServiceStatus //服務狀態[0:'停止營運',1:'正常營運',2:'暫停營運']
          }
          // console.log(stn_obj);
          // console.log(bike_obj);
          
          // 車站標記 icon & popup 內容
          let str = `${stn_obj.StationName} <br>`;
          str += `${stn_obj.StationAddress} <br>`
          str += `共可容納${stn_obj.BikesCapacity}台車 <br>`
          str += `可借:${bike_obj.Rent} 可還:${bike_obj.Return} <br>`
          str += `一般:${bike_obj.General} 電輔:${bike_obj.Electric} `
          const grnMarker = L.AwesomeMarkers.icon({
            icon: "fa-solid fa-bicycle",
            prefix: "fa",
            markerColor: "green",
            iconColor: "white"
          });
          let green = L.marker([stn_obj.PositionLat,stn_obj.PositionLon], {icon: grnMarker});
          
          // 服務狀態判定
          if(bike_obj.ServiceStatus === 2) { //暫停營運上灰底
            green.options.icon.options.markerColor = "gray";
            str = `${stn_obj.StationName} <br>`;
            str += `${stn_obj.StationAddress} <br>`;
            str += `暫停營運`;
          }
          else if (bike_obj.Rent < 1) { //無車可借上橘底
            green.options.icon.options.markerColor = "orange"
          }
          else if (bike_obj.Return < 1) { //無車可還上紅底
            green.options.icon.options.markerColor = "red"
          }
          if(bike_obj.Electric > 0){ //有電輔車才標記閃電
            green.options.icon.options.icon = "fa-solid fa-bolt";
          }
          
          green.bindPopup(`${str}`).openPopup(); // popup
          bikeStopArr.push(green); // 收集自行車站 marker
        }
      });
    });
    // 群集
    let bikeStops = L.markerClusterGroup();
    bikeStopArr.forEach(item => bikeStops.addLayer(item).addTo(map));  // 把自行車站加入 L.markerClusterGroup中
  }
  
  
  
  
  //驗證 TDX 金鑰
  async function GetAuthorizationHeader() {    
      const parameter = {
          grant_type:"client_credentials",
          client_id: "XXXXXXXXXX-XXXXXXXX-XXXX-XXXX",
          client_secret: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
      }; 
      
      let auth_url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token";
    
      const options = {
        method: 'POST',
        url: auth_url,
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: Qs.stringify(parameter)
      }
      try {
        let res = await axios(options);
        let accesstoken = res.data;      
        return {
          'authorization': 'Bearer ' + accesstoken.access_token
        }
      } catch (err) {
        console.log(err);
      }
  }
  //取得 api 
  async function GetApiResponse(apiUrl, token) {
    try {
      let res = await axios.get(apiUrl, {
        // headers: await GetAuthorizationHeader()
        headers: token
      });
      return res.data;
      
    } catch (err) {
      console.log(err);
      return 0;
    }
  }
  
  