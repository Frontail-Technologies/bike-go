import { pack } from "../pack";

type Entry = { description: string; h1: string; h2: string; h3: string };

const e = (description: string, h1: string, h2: string, h3: string): Entry => ({ description, h1, h2, h3 });

type Rows = Record<
  | "royal-enfield-classic-350"
  | "royal-enfield-hunter-350"
  | "honda-cb350"
  | "yamaha-mt-15"
  | "ktm-duke-200"
  | "tvs-apache-rtr-200"
  | "royal-enfield-himalayan"
  | "hero-xpulse-200"
  | "royal-enfield-super-meteor-650"
  | "honda-activa-6g",
  Entry
>;

const en: Rows = {
  "royal-enfield-classic-350": e("The easy-going classic. Comfortable seat, the thump you expect, and enough torque for city streets and highway days alike.", "Dual-channel ABS", "Comfortable upright seat", "Great for couples"),
  "royal-enfield-hunter-350": e("A lighter, sharper roadster from the same family. Easy to turn, easy to park and fun in traffic.", "Lightest in the 350 range", "Nimble in the city", "Disc brakes both ends"),
  "honda-cb350": e("Smooth, refined and quiet for a retro. A relaxed ride with traction control and a big tank.", "Honda Selectable Torque Control", "Refined engine", "15L tank"),
  "yamaha-mt-15": e("Naked street fighter with a sharp stance and a rev-happy engine. Light, quick and great fun on twisty roads.", "Slipper clutch", "Upside-down forks", "Under 145 kg"),
  "ktm-duke-200": e("Punchy single-cylinder power in a flickable chassis. The quickest way through a city.", "24 bhp from 200cc", "Digital cluster", "Dual-channel ABS"),
  "tvs-apache-rtr-200": e("Track-inspired and good value. Strong brakes, a firm chassis and an easy-to-live-with engine.", "Ride modes", "Good value per day", "Bluetooth connectivity"),
  "royal-enfield-himalayan": e("Built for long roads and rough ones. Long-travel suspension and a relaxed engine make it a proper touring partner.", "220 mm ground clearance", "Luggage-ready", "Switchable ABS"),
  "hero-xpulse-200": e("Light and capable off the tarmac. Tall suspension and a forgiving engine make rough roads easy.", "Long-travel suspension", "Lightweight", "Easy off-road"),
  "royal-enfield-super-meteor-650": e("A big, smooth twin made for the highway. Low seat, wide bars and effortless pull at any speed.", "Parallel twin", "Tripper navigation", "Long-distance comfort"),
  "honda-activa-6g": e("The easiest way around town. Twist and go, with storage under the seat and great mileage.", "No gears to learn", "Under-seat storage", "Best mileage"),
};

const km: Rows = {
  "royal-enfield-classic-350": e("ម៉ូតូបុរាណងាយបើក។ កៅអីស្រួល សំឡេងម៉ាស៊ីនដែលអ្នករំពឹងទុក និងកម្លាំងគ្រប់គ្រាន់សម្រាប់ទាំងផ្លូវក្នុងក្រុង និងផ្លូវហាយវេ។", "ABS ពីរបណ្តាញ", "កៅអីឈរត្រង់ស្រួល", "ស័ក្តិសមសម្រាប់គូស្នេហ៍"),
  "royal-enfield-hunter-350": e("ម៉ូតូស្រាលជាង និងរហ័សជាង មកពីគ្រួសារតែមួយ។ ងាយបត់ ងាយចត និងសប្បាយក្នុងចរាចរណ៍។", "ស្រាលជាងគេក្នុងស៊េរី 350", "រហ័សរហួនក្នុងទីក្រុង", "ហ្វ្រាំងឌីសទាំងពីរ"),
  "honda-cb350": e("រលូន ទាន់សម័យ និងស្ងាត់សម្រាប់ម៉ូតូរ៉េត្រូ។ ការជិះស្រួលជាមួយប្រព័ន្ធត្រួតពិនិត្យកម្លាំងអូស និងធុងធំ។", "Honda Selectable Torque Control", "ម៉ាស៊ីនទំនើប", "ធុង ១៥ លីត្រ"),
  "yamaha-mt-15": e("ម៉ូតូស្ទ្រីតទម្រង់ស្រួចស្រាវជាមួយម៉ាស៊ីនរហ័ស។ ស្រាល លឿន និងសប្បាយនៅលើផ្លូវកោង។", "ក្លឹចរអិល", "ហ្វកក្រោមឡើងលើ", "ក្រោម ១៤៥ គីឡូក្រាម"),
  "ktm-duke-200": e("កម្លាំងស៊ីឡាំងតែមួយខ្លាំងក្នុងតួរថយន្តរហ័សរហួន។ វិធីលឿនបំផុតឆ្លងកាត់ទីក្រុង។", "២៤ bhp ពី ២០០cc", "ផ្ទាំងបញ្ជាឌីជីថល", "ABS ពីរបណ្តាញ"),
  "tvs-apache-rtr-200": e("បំផុសគំនិតពីសង្វៀនប្រណាំង និងមានតម្លៃសមរម្យ។ ហ្វ្រាំងមាំ តួរថយន្តរឹង និងម៉ាស៊ីនងាយប្រើ។", "ម៉ូដនៃការជិះ", "តម្លៃសមរម្យក្នុងមួយថ្ងៃ", "ការតភ្ជាប់ប៊្លូធូស"),
  "royal-enfield-himalayan": e("សាងសង់សម្រាប់ផ្លូវឆ្ងាយ និងផ្លូវរដុប។ ការព្យួរវែង និងម៉ាស៊ីនស្ងប់ធ្វើឱ្យវាក្លាយជាដៃគូធ្វើដំណើរពិតប្រាកដ។", "កម្ពស់ពីដី ២២០ ម.ម", "ត្រៀមដាក់អីវ៉ាន់", "ABS អាចបិទបាន"),
  "hero-xpulse-200": e("ស្រាល និងអាចជិះបានល្អនៅក្រៅផ្លូវកៅស៊ូ។ ការព្យួរខ្ពស់ និងម៉ាស៊ីនទន់ភ្លន់ធ្វើឱ្យផ្លូវរដុបងាយស្រួល។", "ការព្យួរវែង", "ទម្ងន់ស្រាល", "ងាយជិះក្រៅផ្លូវ"),
  "royal-enfield-super-meteor-650": e("ម៉ាស៊ីនពីរស៊ីឡាំងធំ រលូន ធ្វើឡើងសម្រាប់ផ្លូវហាយវេ។ កៅអីទាប ដៃចង្កូតធំ និងកម្លាំងទាញស្រួលគ្រប់ល្បឿន។", "ម៉ាស៊ីនពីរស៊ីឡាំងស្របគ្នា", "ការណែនាំផ្លូវ Tripper", "ស្រួលសម្រាប់ដំណើរឆ្ងាយ"),
  "honda-activa-6g": e("វិធីងាយស្រួលបំផុតដើម្បីធ្វើដំណើរក្នុងទីក្រុង។ បង្វិល ហើយទៅ ជាមួយកន្លែងដាក់អីវ៉ាន់ក្រោមកៅអី និងសន្សំសំចៃសាំង។", "មិនចាំបាច់រៀនលេខ", "កន្លែងដាក់អីវ៉ាន់ក្រោមកៅអី", "សន្សំសាំងបំផុត"),
};

const zh: Rows = {
  "royal-enfield-classic-350": e("轻松随性的经典款。座椅舒适，发动机声浪十足，扭矩足以应对市区道路和高速公路。", "双通道 ABS", "舒适的直立坐姿", "适合情侣同骑"),
  "royal-enfield-hunter-350": e("同门系列中更轻更敏捷的街车。转向灵活，停放方便，穿梭车流乐趣十足。", "350 系列中最轻", "市区灵活穿行", "前后碟刹"),
  "honda-cb350": e("复古车型中少有的顺滑、精致又安静。放松的骑行体验，配有牵引力控制和大油箱。", "本田可选扭矩控制", "精致的发动机", "15 升油箱"),
  "yamaha-mt-15": e("造型凌厉的街头裸车，发动机转速响应灵敏。轻便、迅捷，在弯道上乐趣无穷。", "防跳离合器", "倒置前叉", "整备质量低于 145 公斤"),
  "ktm-duke-200": e("单缸动力强劲，车架灵活。穿越城市最快的方式。", "200cc 输出 24 马力", "数字仪表盘", "双通道 ABS"),
  "tvs-apache-rtr-200": e("赛道灵感，性价比高。制动有力，车架扎实，发动机好用耐用。", "多种骑行模式", "日租性价比高", "蓝牙连接"),
  "royal-enfield-himalayan": e("为长途和崎岖道路而生。长行程悬挂和平顺的发动机，使它成为称职的旅行伙伴。", "220 毫米离地间隙", "可加装行李", "可关闭 ABS"),
  "hero-xpulse-200": e("轻便，越野能力出色。高行程悬挂和宽容的发动机让崎岖道路变得轻松。", "长行程悬挂", "车身轻便", "轻松越野"),
  "royal-enfield-super-meteor-650": e("为高速公路打造的大排量平顺双缸车。座位低，把手宽，任何速度都能轻松加速。", "并列双缸", "Tripper 导航", "长途舒适"),
  "honda-activa-6g": e("在城市中出行最轻松的方式。拧动油门即走，座椅下有储物空间，油耗出色。", "无需学换挡", "座椅下储物", "油耗最佳"),
};

const ko: Rows = {
  "royal-enfield-classic-350": e("느긋하게 즐기는 클래식. 편안한 시트, 기대한 만큼의 배기음, 시내와 고속도로 모두에 충분한 토크.", "듀얼 채널 ABS", "편안한 업라이트 시트", "커플 라이딩에 좋아요"),
  "royal-enfield-hunter-350": e("같은 계열에서 더 가볍고 날렵한 로드스터. 방향 전환과 주차가 쉽고 도심 주행이 즐겁습니다.", "350 라인업 중 가장 가벼움", "도심에서 민첩함", "앞뒤 디스크 브레이크"),
  "honda-cb350": e("레트로 바이크치고 부드럽고 세련되며 조용합니다. 트랙션 컨트롤과 큰 연료 탱크로 편안한 라이딩.", "혼다 셀렉터블 토크 컨트롤", "세련된 엔진", "15L 연료 탱크"),
  "yamaha-mt-15": e("날카로운 자세와 잘 도는 엔진의 네이키드 스트리트 파이터. 가볍고 빠르며 굽은 길에서 아주 재미있습니다.", "슬리퍼 클러치", "도립식 포크", "145kg 미만"),
  "ktm-duke-200": e("민첩한 차체에 담긴 강력한 단기통 파워. 도시를 가장 빠르게 가로지르는 방법.", "200cc에서 24마력", "디지털 계기판", "듀얼 채널 ABS"),
  "tvs-apache-rtr-200": e("트랙에서 영감을 받은 가성비 모델. 강한 브레이크, 단단한 차체, 다루기 쉬운 엔진.", "라이드 모드", "하루 대여 가성비 우수", "블루투스 연결"),
  "royal-enfield-himalayan": e("긴 도로와 거친 도로를 위해 만들었습니다. 긴 서스펜션 스트로크와 여유로운 엔진으로 훌륭한 투어링 파트너.", "최저 지상고 220mm", "짐 적재 준비 완료", "ABS 해제 가능"),
  "hero-xpulse-200": e("가볍고 비포장에서도 뛰어납니다. 높은 서스펜션과 너그러운 엔진으로 거친 길도 쉽습니다.", "긴 서스펜션 스트로크", "경량", "오프로드 주행 용이"),
  "royal-enfield-super-meteor-650": e("고속도로를 위해 만든 크고 부드러운 트윈. 낮은 시트, 넓은 핸들, 어떤 속도에서도 수월한 가속.", "병렬 트윈", "트리퍼 내비게이션", "장거리 승차감"),
  "honda-activa-6g": e("도시를 누비는 가장 쉬운 방법. 돌리고 달리기만 하면 되고, 시트 아래 수납공간과 뛰어난 연비.", "기어 조작 불필요", "시트 아래 수납", "최고 연비"),
};

export default pack(en, { km, zh, ko });
