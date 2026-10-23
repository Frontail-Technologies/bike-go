import { pack } from "../pack";

export default pack(
  {
    state: "Rajasthan",
    cityLabel: "{city}, Rajasthan",
    pickupCity: "Pickup city",
    pickupCityAria: "Pickup city: {label}. Change",
    chooseHub: "Choose a hub",
    hubOption: "{city} · {hub}",
    hours: "7 AM – 9 PM",
    cities: { Jaipur: "Jaipur", Udaipur: "Udaipur", Jodhpur: "Jodhpur" },
    hubs: {
      Jaipur: { name: "RideGo C-Scheme Hub", address: "12 Ashok Marg, C-Scheme, Jaipur 302001" },
      Udaipur: { name: "RideGo Fatehsagar Hub", address: "5 Lake Road, near Fatehsagar, Udaipur 313001" },
      Jodhpur: { name: "RideGo Clock Tower Hub", address: "8 Sardar Market Road, Jodhpur 342001" },
    },
  },
  {
    km: {
      state: "រ៉ាចាស្ថាន",
      cityLabel: "{city}, រ៉ាចាស្ថាន",
      pickupCity: "ទីក្រុងទទួលម៉ូតូ",
      pickupCityAria: "ទីក្រុងទទួលម៉ូតូ៖ {label}។ ប្តូរ",
      chooseHub: "ជ្រើសរើសចំណុចទទួល",
      hubOption: "{city} · {hub}",
      hours: "៧ ព្រឹក – ៩ យប់",
      cities: { Jaipur: "ជ័យពួរ", Udaipur: "អ៊ូដៃពួរ", Jodhpur: "ជោធពួរ" },
      hubs: {
        Jaipur: { name: "ចំណុច RideGo C-Scheme", address: "១២ ផ្លូវអសោក C-Scheme ជ័យពួរ 302001" },
        Udaipur: { name: "ចំណុច RideGo Fatehsagar", address: "៥ ផ្លូវបឹង ជិត Fatehsagar អ៊ូដៃពួរ 313001" },
        Jodhpur: { name: "ចំណុច RideGo Clock Tower", address: "៨ ផ្លូវផ្សារ Sardar ជោធពួរ 342001" },
      },
    },
    zh: {
      state: "拉贾斯坦邦",
      cityLabel: "{city}，拉贾斯坦邦",
      pickupCity: "取车城市",
      pickupCityAria: "取车城市：{label}。点击更改",
      chooseHub: "选择取车点",
      hubOption: "{city} · {hub}",
      hours: "上午 7 点 – 晚上 9 点",
      cities: { Jaipur: "斋浦尔", Udaipur: "乌代布尔", Jodhpur: "焦特布尔" },
      hubs: {
        Jaipur: { name: "RideGo C-Scheme 取车点", address: "斋浦尔 C-Scheme 阿育王路 12 号，302001" },
        Udaipur: { name: "RideGo Fatehsagar 取车点", address: "乌代布尔 Fatehsagar 附近湖路 5 号，313001" },
        Jodhpur: { name: "RideGo Clock Tower 取车点", address: "焦特布尔 Sardar 市场路 8 号，342001" },
      },
    },
    ko: {
      state: "라자스탄",
      cityLabel: "{city}, 라자스탄",
      pickupCity: "픽업 도시",
      pickupCityAria: "픽업 도시: {label}. 변경",
      chooseHub: "거점 선택",
      hubOption: "{city} · {hub}",
      hours: "오전 7시 – 오후 9시",
      cities: { Jaipur: "자이푸르", Udaipur: "우다이푸르", Jodhpur: "조드푸르" },
      hubs: {
        Jaipur: { name: "RideGo C-Scheme 거점", address: "자이푸르 C-Scheme 아쇼크 마르그 12, 302001" },
        Udaipur: { name: "RideGo Fatehsagar 거점", address: "우다이푸르 Fatehsagar 인근 레이크 로드 5, 313001" },
        Jodhpur: { name: "RideGo Clock Tower 거점", address: "조드푸르 Sardar Market Road 8, 342001" },
      },
    },
  },
);
