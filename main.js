// import
import * as CONFIG from "./config.js";





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
  L.circle(latlng, radius, {className: 'walkscope'}).addTo(map); // 標示步行 10min 範圍方圓 800m

  let token = await GetAuthorizationHeader(); // 取得 token
  // call function
  let mrtStns = await findMrtStn(token); // 捷運
  let lrtStns = await findLrtStn(token); // 輕軌
  let bikeStops = await findBikeStn(token); // 自行車
  let busStops = await findBusStn(token); // 公車

  // 覆蓋圖層obj
  var overlayMaps = {
     "捷運": mrtStns,
     "輕軌": lrtStns,
     "自行車": bikeStops, 
    "公車": busStops
  };

  // 圖層控制
  let layerControl = L.control.layers(null, overlayMaps, {position: 'bottomleft'}).addTo(map);

  map.setZoom(13) // 設定縮放層級
  map.on('moveend', moveend); // 地圖移動事件
}

// 定位失敗訊息
function onLocationError(e) {
  alert(e.message);
}

// 地圖移動事件
function moveend() {
  setTimeout(reCircle(), 1000); // 延遲執行重新畫圓
  // 重新畫圓
  function reCircle() {
    // 移除既有的圓圈
    let el = document.querySelectorAll("path.walkscope");
    if(el !== "") {
      el.forEach(el => {
        el.remove();
      });
    }
    let latlng = map.getCenter(); // 取得地圖中心
    let radius = 800; // 步行範圍
    L.circle(latlng, radius, {className: 'walkscope'}).addTo(map); // 標示步行 10min 範圍方圓 800m
  }
}

// 控制面板
var info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};





// 找捷運站
async function findMrtStn(token) {
  // 呼叫 高雄捷運 api
  let mrtStn_api = `https://tdx.transportdata.tw/api/basic/V3/Map/Rail/Network/Station/OperatorCode/KRTC?%24format=GEOJSON`;
  let mrtStn_data = await GetApiResponse(mrtStn_api, token);
  mrtStn_data = mrtStn_data.features;
  let mrtStns = L.layerGroup(); // 存捷運站 circle

  // 讀 api 回傳資料做捷運站 obj
  mrtStn_data.forEach((mrtStn_item) => {
    let mrtStn_obj = {
      ID: mrtStn_item.properties.model.StationID,
      Name: mrtStn_item.properties.model.StationName,
      Lat: mrtStn_item.geometry.coordinates[1], //緯度22
      Lng: mrtStn_item.geometry.coordinates[0], //經度120
    }
    
    // 捷運站圓圈的樣式 //紅線&橘線
    const mrtOrgStyle = {
      color: 'orange',
      fillColor: 'orange',
      fillOpacity: 0.5
    }
    const mrtRedStyle = {
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.5
    }
    // 車站標記 circle & popup
    let mrtStn = L.circle([mrtStn_obj.Lat,mrtStn_obj.Lng], {radius: 100})
      .bindPopup(`<b>${mrtStn_obj.ID} ${mrtStn_obj.Name}</b><br>`).openPopup();
    
    //判定紅橘線 
    // ※circle options 才有 radius，但 setStyle 僅處理 path options 無 radius
    if(mrtStn_obj.ID.charAt(0) === "R") {
      mrtStn.setStyle(mrtRedStyle);
    }
    else if (mrtStn_obj.ID.charAt(0) === "O") {
      mrtStn.setStyle(mrtOrgStyle);   
    }
    mrtStns.addLayer(mrtStn).addTo(map); // 收集捷運站 circle
  });
  return mrtStns
}

// 找輕軌站
async function findLrtStn(token) {
  // 呼叫高雄輕軌 api
  let lrtStn_api = `https://tdx.transportdata.tw/api/basic/V3/Map/Rail/Network/Station/OperatorCode/KLRT?%24format=GEOJSON`;
  let lrtStn_data = await GetApiResponse(lrtStn_api, token);
  
  lrtStn_data = lrtStn_data.features;
  let lrtStns = L.layerGroup(); // 存輕軌站 circle

  // 讀 api 回傳資料做輕軌站 obj
  lrtStn_data.forEach((lrtStn_item) => {
    let lrtStn_obj = {
      ID: lrtStn_item.properties.model.StationID,
      Name: lrtStn_item.properties.model.StationName,
      Lat: lrtStn_item.geometry.coordinates[1], //緯度22
      Lng: lrtStn_item.geometry.coordinates[0], //經度120
    }
      
    // 輕軌站圈圈的樣式 //綠色
    const lrtStyle = {
      radius: 100,
      color: 'green',
      fillColor: 'green',
      fillOpacity: 0.5
    }
    // 車站標記 circle & popup
    let lrtStn = L.circle([lrtStn_obj.Lat,lrtStn_obj.Lng], lrtStyle/*{radius: 100}*/).addTo(map)
      .bindPopup(`<b>${lrtStn_obj.ID} ${lrtStn_obj.Name}</b><br>`).openPopup();
    // lrtStn.setStyle(lrtStyle);
    lrtStns.addLayer(lrtStn).addTo(map); // 收集輕軌站 circle
  });
  return lrtStns
}

// 找自行車
async function findBikeStn(token){
    // 車站 & 各站車輛 api
    let stn_api = 'https://tdx.transportdata.tw/api/basic/v2/Bike/Station/City/Kaohsiung?%24format=JSON';
    let bike_api = 'https://tdx.transportdata.tw/api/basic/v2/Bike/Availability/City/Kaohsiung?%24format=JSON';
    // 呼叫高雄 youbike api
    let stn_data = await GetApiResponse(stn_api, token);
    let bike_data = await GetApiResponse(bike_api, token);
    // 宣告物件存值方便取用
    let stn_obj;
    let bike_obj;
    let landmark = L.layerGroup(); // 存最後點擊 marker
    // 自行車站群集
    let bikeStops = L.markerClusterGroup({
      maxClusterRadius: function (zoom) { 
          return (zoom <= 14) ? 80 : 1; // 縮放程度14以下才以80px為單位做群集
      }
    });
    
    /// 讀 api 回傳資料做自行車站 obj
    stn_data.forEach(s_item => {
      stn_obj = {
        PositionLon: s_item.StationPosition.PositionLon, //經度
        PositionLat: s_item.StationPosition.PositionLat, //緯度
        StationName: s_item.StationName.Zh_tw, //站名
        StationAddress: s_item.StationAddress.Zh_tw, //地址
        BikesCapacity: s_item.BikesCapacity, //車位總數
      }
      // 讀 api 回傳資料做各站車輛資料 obj
      bike_data.filter((b_item, index, array) => {
        // 兩組資料透過 StationUID 連結
        if(b_item.StationUID === s_item.StationUID){
          bike_obj = {
            "Rent": b_item.AvailableRentBikes, //可借車輛數
            "Return": b_item.AvailableReturnBikes, //可還車位數
            "General": b_item.AvailableRentBikesDetail.GeneralBikes, //2.0 車輛數
            "Electric": b_item.AvailableRentBikesDetail.ElectricBikes, //2.0E 車輛數
            "ServiceStatus": b_item.ServiceStatus //服務狀態[0:'停止營運',1:'正常營運',2:'暫停營運']
          }
          
          // 車站標記 icon & popup 內容
          let str = `<b>${stn_obj.StationName}</b> <br>`
          str += `${stn_obj.StationAddress} <br>`
          str += `共可容納${stn_obj.BikesCapacity}台車 <br>`
          str += `可借: ${bike_obj.Rent} 可還: ${bike_obj.Return} <br>`
          str += `一般: ${bike_obj.General} 電輔: ${bike_obj.Electric} `
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
            str = `<b>${stn_obj.StationName}</b> <br>`;
            str += `${stn_obj.StationAddress} <br>`;
            str += `暫停營運`;
          }
          else if (bike_obj.Rent < 1) { //無車可借上橘底
            green.options.icon.options.markerColor = "orange";
          }
          else if (bike_obj.Return < 1) { //無車可還上紅底
            green.options.icon.options.markerColor = "red";
          }
          if(bike_obj.Electric > 0){ //有電輔車才標記閃電
            green.options.icon.options.icon = "fa-solid fa-bolt";
          }
          
          green.bindPopup(`${str}`).openPopup(); // popup
          bikeStops.addLayer(green).addTo(map) // 把自行車站加入群集

          // 點擊自行車站，切換單獨顯示or融入群集
          green.on('click', function(e) {
            if(landmark.getLayers().length > 0) {
              landmark.eachLayer(function(layer) {
                landmark.removeLayer(layer); // 從單獨顯示圖層移除 marker
                bikeStops.addLayer(layer).addTo(map); // 回歸群集
              });
            }
            bikeStops.removeLayer(e.target); // 從群集移除點擊 marker
            landmark.addLayer(e.target).addTo(map); // 單獨顯示
            e.target.openPopup(); // 打開彈出視窗
          });
        }
      });
    });    
    return bikeStops
}

//找公車站牌
async function findBusStn(token) {
  // 呼叫高雄市公車 api
  let findStn_api = `https://tdx.transportdata.tw/api/basic/v2/Bus/Station/City/Kaohsiung?%24%24format=JSON`; // 暫改 500m // 800m 約走路 10min
  let stn_data =  await GetApiResponse(findStn_api, token);
  
  let landmark = L.layerGroup(); // 存最後點擊 marker
  // 公車站牌群集
  let busStops = L.markerClusterGroup({
    maxClusterRadius: function (zoom) {
        return (zoom <= 14) ? 80 : 1; // 縮放程度14以下才以80px為單位做群集
    }
  });
  
  // 讀 api 回傳資料做公車站位 obj
  stn_data.forEach((stn_data) => {
    let Stops = stn_data.Stops;
    let routeUID_arr = []; //存路線UID
    let routeName_arr = []; //存路線名稱
    
    let stn_obj = {
      UID: stn_data.StationUID, //站位UID
      ID: stn_data.StationID, //站位ID
      Name: stn_data.StationName.Zh_tw, //站位名稱
      Lat: stn_data.StationPosition.PositionLat, //緯度22
      Lng: stn_data.StationPosition.PositionLon, //經度120
      RouteUIDs: "", //通過路線UID
      RouteNames: "", //通過路線名稱
    }
    // 塞通過路線到 stn_obj
    Stops.forEach((Stop) => {
      routeUID_arr.push(Stop.RouteUID);
      routeName_arr.push(Stop.RouteName.Zh_tw);
    })
    stn_obj.RouteUIDs = routeUID_arr;
    stn_obj.RouteNames = routeName_arr;
    
    // 車站標記 icon & popup
    const busStyle = L.AwesomeMarkers.icon({
      icon: "fa-solid fa-bus-simple",
      prefix: "fa",
      iconColor: "white"
    });
    let busStn = L.marker([stn_obj.Lat,stn_obj.Lng], busStyle)
      .bindPopup(`<b>${stn_obj.Name}</b><br>${stn_obj.RouteNames}`).openPopup();
    busStops.addLayer(busStn).addTo(map); //收集公車站牌 marker

    // 點擊公車站，切換單獨顯示or融入群集
    busStn.on('click', function(e) {
      if(landmark.getLayers().length > 0) {
        landmark.eachLayer(function(layer) {
          landmark.removeLayer(layer); // 從單獨顯示圖層移除 marker
          busStops.addLayer(layer).addTo(map); // 回歸群集
        });
      }
      busStops.removeLayer(e.target); // 從群集移除點擊 marker
      landmark.addLayer(e.target).addTo(map); // 單獨顯示
      e.target.openPopup(); // 打開彈出視窗
    });

    // // 公車站位點擊事件
    busStn.on("click", async function findRoutes(e) {
      //移除既有路線
      let el = document.querySelectorAll("path.viaroutes");
      if(el !== "") {
        el.forEach(el => {
          el.remove();
        });
      }
      
      let Routes = stn_obj.RouteUIDs; //通過該站牌的所有路線
      let str = `<h4>${stn_obj.Name} 預估到站</h4>`;
      
      //預估到站(N1) api 才有方向 //指定縣市、站位 //進階才有指定站位
      let time_api = `https://tdx.transportdata.tw/api/advanced/v2/Bus/EstimatedTimeOfArrival/City/Kaohsiung/PassThrough/Station/${stn_obj.ID}?%24format=JSON`;
      let time_data = await GetApiResponse(time_api, token);
      if(time_data.length === 0) { alert(`查無預估到站資料`) }
      for (let j = 0; j < time_data.length; j++) {
        let bus_obj = {
          PlateNumb: time_data[j].PlateNumb, //車號 //可能為空值
          Route: time_data[j].RouteName.Zh_tw, //路線名稱
          RouteUID: time_data[j].RouteUID, //路線 UID
          Direction: time_data[j].Direction, //車子方向
          EstimateTime: time_data[j].EstimateTime, // 到站時間預估(秒) //可能無資料
          StopStatus: time_data[j].StopStatus, //車輛狀態 
          IsLastBus: time_data[j].IsLastBus, //是否為末班車 //好像沒顯示
          NextBusTime: time_data[j].NextBusTime, //下一班公車到達時間 //可能無資料
          Geometry: ""// shape_data[k].Geometry
        }
          
        //線型路線 api
        let shape_api = `https://tdx.transportdata.tw/api/advanced/v2/Bus/Shape/City/Kaohsiung/PassThrough/Station/${stn_obj.ID}?%24filter=Direction%20eq%20%27${bus_obj.Direction}%27%20and%20RouteUID%20eq%20%27${bus_obj.RouteUID}%27&%24top=30&%24format=JSON`
        let shape_data = await GetApiResponse(shape_api, token)
        if(shape_data.length === 0) { alert(`查無線型路線資料`) }
        bus_obj.Geometry = shape_data[0].Geometry
        renderLine(bus_obj);
        
        //按點擊站位更新到站資訊
        function infoUpd (route_obj) {
          return function(props) {
            str += `<div id = ${route_obj.RouteUID}_${route_obj.Direction}> ` // divID
            str += `<b>${route_obj.Route}</b> ` // 路線名稱
            

            // 去返程(該方向指的是此車牌車輛目前所在路線的去返程方向，非指站站牌所在路線的去返程方向
            // [0:'去程',1:'返程',2:'迴圈',255:'未知']
            if (route_obj.Direction === 0) {str += `去程 `}
            else if (route_obj.Direction === 1) {str += `返程 `}
            else if (route_obj.Direction === 2) {str += `迴圈 `}
            else if (route_obj.Direction === 255) {str += `未知 `}
            else {str += `${route_obj.Direction} `}
            

            // 到站時間預估(秒) [當StopStatus値為2~4或PlateNumb値為-1時，EstimateTime値為null; 
            // 當StopStatus値為1時， EstimateTime値多數為null，
            // 僅部分路線因有固定發車時間，故EstimateTime有値; 
            // 當StopStatus値為0時，EstimateTime有値。]
            let estTime= convertSecondsToHours(route_obj.EstimateTime);
            

            // 下一班公車到達時間(ISO8601格式:yyyy-MM-ddTHH:mm:sszzz)
            // 檢查NaN // 轉成 hh:ss 格式
            function timeLocale(time) {
              time = new Date(time)
              let h = time.getHours();
              let m = time.getMinutes();
              if (Number.isNaN(h) === true) { return 0; }
              if (Number.isNaN(m) === true) { return 0; }
              return `${h < 10 ? "0" : ""}${h}:${m < 10 ? "0" : ""}${m}`;
            }
            // 轉換 yyyy-m-d
            function checktime(time) {
              let date = `${time.getFullYear()}-${time.getMonth()+1}-${time.getDate()}`
              return date
            }
            let today = new Date(); //2023-01-01T09:55:57.230Z
            today = checktime(today); 
            let next = new Date(route_obj.NextBusTime) //2023-01-01T21:53:00+08:00
            next = checktime(next);
            

            // 下班車發車時間為當天則顯示 hh:mm 
            let nxtBustime;
            if(today === next) { 
              nxtBustime =  timeLocale(route_obj.NextBusTime) 
            }
            else { //NaN-NaN-NaN(末班車已過) or 不同天
              nxtBustime = route_obj.NextBusTime 
            }
            
            
            // 當StopStatus値為2~4或PlateNumb値為-1時，EstimateTime値為null; 
            // 當StopStatus値為1時， EstimateTime値多數為null，僅部分路線因有固定發車時間，故EstimateTime有値; 
            // 當StopStatus値為0時，EstimateTime有値。
            // 車輛狀態備註 : [0:'正常',1:'尚未發車',2:'交管不停靠',3:'末班車已過',4:'今日未營運']
            // str += `<b>${route_obj.StopStatus}</b> `
            if (route_obj.StopStatus === 0) {str += `<b>${estTime}後</b>到站，車號${route_obj.PlateNumb} `} // 正常
            else if (route_obj.StopStatus === 1) {
              if (nxtBustime === 0) {str += `尚未發車</b>`} // 下班車發車時間為NaN:NaN
              else {str += `尚未發車，下一班<b>${nxtBustime}</b>`}
            } // 尚未發車
            else if (route_obj.StopStatus === 2) {str += `<b>交管不停靠</b>`} // 交管不停靠
            else if (route_obj.StopStatus === 3) {str += `<b>末班車已過</b>`} // 末班車已過
            else if (route_obj.StopStatus === 4) {str += `<b>今日未營運</b>`} // 今日未營運
            else {str += `<b>${route_obj.StopStatus}</b>`}
            
            
            str += `</div>`
            this._div.innerHTML = str;
            // document.querySelector("#table").innerHTML = str;
            L.DomUtil.get("table").innerHTML = str;
          } 
        } 
        info.update = infoUpd(bus_obj);
        info.addTo(map);
      }
    }); 
  });
  return busStops
}

//渲染路線
function renderLine(bus_obj) {
  //wicket 套件
  let geo = bus_obj.Geometry;
  const wicket = new Wkt.Wkt();
  let geojsonFeature = wicket.read(geo).toJson();  //轉換線性資料
        
  const lineStyle = {
    color: "gray",
    weight: 5,
    opacity: 1,
    className: 'viaroutes'
  };
      
  // 隨機生成 (r, g, b) 色碼
  let ranR = Math.floor(Math.random() * 255);
  let ranG = Math.floor(Math.random() * 255);
  let ranB = Math.floor(Math.random() * 255);
  lineStyle.color = `rgb(${ranR}, ${ranG}, ${ranB})` // 用隨機生成的色碼填色

  // 畫路線
  let geojson = L.geoJSON(geojsonFeature, {
    style: lineStyle,
    onEachFeature: function (feature, layer) {
      layer.bindTooltip(`${bus_obj.Route}`).openTooltip(); // 標路線名稱
      layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
      });
    }
  })
  .addTo(map);
}

function highlightFeature(e) {
  var layer = e.target;
  layer.setStyle({weight: 8,}); // 加粗
  layer.bringToFront(); // 移至最上層
  // info.update(layer.feature.properties);
}
function resetHighlight(e) {
  e.target.setStyle({weight: 5,});
  // info.update();
}
function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds()); // zoomToFeature
}
// 秒數轉換
function convertSecondsToHours(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor((sec % 3600) % 60);
  return `${h< 10 ? "0" : ""}${h}時${m < 10 ? "0" : ""}${m}分`;
}


  
  
  
  //驗證 TDX 金鑰
  async function GetAuthorizationHeader() {    
      const parameter = {
          grant_type:"client_credentials",
          client_id: CONFIG.CLIENT_ID,
          client_secret: CONFIG.CLIENT_SECRET
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