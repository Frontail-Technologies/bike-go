import { adminPack } from "./pack";

export default adminPack(
  {
    ui: {
      search: "Search…",
      view: "View",
      table: "Table",
      cards: "Cards",
      breadcrumb: "Breadcrumb",
      dateRangeIct: "Date range, Cambodia time",
      bookingDateRange: "Booking date range",
      vsLastMonth: "vs last month",
      loadingPage: "Loading admin page",
      loadingWorkspace: "Loading workspace…",
      loadingLabels: { loanApplications: "Loading loan applications…", application: "Loading application…", locationForm: "Loading location form…", administrators: "Loading administrators…", feedback: "Loading feedback…", ticket: "Loading ticket…", customer: "Loading customer…", customers: "Loading customers…", payments: "Loading payments…", payment: "Loading payment…", bookings: "Loading bookings…", booking: "Loading booking…", bannerForm: "Loading banner form…", banners: "Loading banners…", documents: "Loading documents…", document: "Loading document…", locations: "Loading locations…", settings: "Loading settings…" },
      document: {
        title: "Supporting document", hint: "PDF, JPG or PNG · up to {size} MB", replace: "Replace", choose: "Choose file",
        chooseLocal: "Choose a local document", unsupported: "This file type is not supported.", tooLarge: "File must be {size} MB or smaller.",
        notAccepted: "Document not accepted", unknownType: "Unknown type", remove: "Remove {name}",
      },
      images: {
        emptyTitle: "Click to upload images", hint: "or drag and drop · JPG, PNG or WebP · up to {size} MB each", choose: "Choose files",
        invalid: "Use image files up to {size} MB. Maximum {limit} images.", notAdded: "Some images were not added", primary: "Primary",
        makePrimary: "Make primary", moveEarlier: "Move {name} earlier", moveLater: "Move {name} later", remove: "Remove {name}",
        selected: "Selected images", preview: "Preview {name}", addMore: "Add more images", count: "{count}/{limit} images",
      },
      charts: {
        noData: "No chart data", noDataDescription: "Data will appear here when it becomes available.", loading: "Loading chart", value: "Value",
        noMetricData: "No {label} data", barSummary: "{label} by period. Values are also available in the chart tooltip.", barChart: "{label} bar chart",
        acrossRange: "{label} across the selected range", noRevenue: "No revenue activity",
        revenueSummary: "Revenue chart in USD. Booked and paid amounts are shown as separate lines.", revenueTrend: "Revenue trend in USD",
        booked: "Booked", paid: "Paid", total: "Total", noStatus: "No status activity", statusValues: "Status values",
      },
      notFound: {
        eyebrow: "404 · Admin route not found", title: "This workspace does not exist.",
        description: "The admin link may be outdated or the module may have moved. Return to the dashboard or continue managing vehicles.",
        dashboard: "Admin Dashboard", vehicles: "View Vehicles", imageAlt: "A RideGo scooter beside a winding road and an unknown destination marker",
      },
    },
  },
  {
    ui: {
      search: "ស្វែងរក…",
      view: "ទិដ្ឋភាព",
      table: "តារាង",
      cards: "កាត",
      breadcrumb: "ផ្លូវរុករក",
      dateRangeIct: "ចន្លោះកាលបរិច្ឆេទ ម៉ោងកម្ពុជា",
      bookingDateRange: "ចន្លោះកាលបរិច្ឆេទការកក់",
      vsLastMonth: "ធៀបនឹងខែមុន",
      loadingPage: "កំពុងផ្ទុកទំព័រអ្នកគ្រប់គ្រង",
      loadingWorkspace: "កំពុងផ្ទុកផ្ទាំងការងារ…",
      loadingLabels: { loanApplications: "កំពុងផ្ទុកពាក្យស្នើសុំកម្ចី…", application: "កំពុងផ្ទុកពាក្យស្នើសុំ…", locationForm: "កំពុងផ្ទុកទម្រង់ទីតាំង…", administrators: "កំពុងផ្ទុកអ្នកគ្រប់គ្រង…", feedback: "កំពុងផ្ទុកមតិកែលម្អ…", ticket: "កំពុងផ្ទុកសំបុត្របញ្ហា…", customer: "កំពុងផ្ទុកអតិថិជន…", customers: "កំពុងផ្ទុកអតិថិជន…", payments: "កំពុងផ្ទុកការទូទាត់…", payment: "កំពុងផ្ទុកការទូទាត់…", bookings: "កំពុងផ្ទុកការកក់…", booking: "កំពុងផ្ទុកការកក់…", bannerForm: "កំពុងផ្ទុកទម្រង់បដា…", banners: "កំពុងផ្ទុកបដា…", documents: "កំពុងផ្ទុកឯកសារ…", document: "កំពុងផ្ទុកឯកសារ…", locations: "កំពុងផ្ទុកទីតាំង…", settings: "កំពុងផ្ទុកការកំណត់…" },
      document: {
        title: "ឯកសារភស្តុតាង", hint: "PDF, JPG ឬ PNG · រហូតដល់ {size} MB", replace: "ជំនួស", choose: "ជ្រើសរើសឯកសារ",
        chooseLocal: "ជ្រើសរើសឯកសារពីឧបករណ៍", unsupported: "មិនគាំទ្រប្រភេទឯកសារនេះទេ។", tooLarge: "ឯកសារត្រូវមានទំហំមិនលើស {size} MB។",
        notAccepted: "ឯកសារមិនត្រូវបានទទួលយក", unknownType: "មិនស្គាល់ប្រភេទ", remove: "ដក {name} ចេញ",
      },
      images: {
        emptyTitle: "ចុចដើម្បីផ្ទុករូបភាពឡើង", hint: "ឬអូសហើយទម្លាក់ · JPG, PNG ឬ WebP · រហូតដល់ {size} MB ក្នុងមួយរូប", choose: "ជ្រើសរើសឯកសារ",
        invalid: "សូមប្រើឯកសាររូបភាពមិនលើស {size} MB។ អតិបរមា {limit} រូប។", notAdded: "រូបភាពខ្លះមិនត្រូវបានបន្ថែម", primary: "រូបចម្បង",
        makePrimary: "កំណត់ជារូបចម្បង", moveEarlier: "ផ្លាស់ {name} ទៅមុខ", moveLater: "ផ្លាស់ {name} ទៅក្រោយ", remove: "ដក {name} ចេញ",
        selected: "រូបភាពដែលបានជ្រើស", preview: "មើល {name}", addMore: "បន្ថែមរូបភាពទៀត", count: "{count}/{limit} រូប",
      },
      charts: {
        noData: "មិនមានទិន្នន័យក្រាហ្វ", noDataDescription: "ទិន្នន័យនឹងបង្ហាញនៅទីនេះនៅពេលមាន។", loading: "កំពុងផ្ទុកក្រាហ្វ", value: "តម្លៃ",
        noMetricData: "មិនមានទិន្នន័យ{label}", barSummary: "{label} តាមរយៈពេល។ តម្លៃក៏មាននៅក្នុងប្រអប់ព័ត៌មានក្រាហ្វផងដែរ។", barChart: "ក្រាហ្វរបារ {label}",
        acrossRange: "{label} ក្នុងចន្លោះដែលបានជ្រើស", noRevenue: "មិនមានសកម្មភាពចំណូល",
        revenueSummary: "ក្រាហ្វចំណូលជា USD។ ចំនួនទឹកប្រាក់បានកក់ និងបានបង់ត្រូវបានបង្ហាញជាខ្សែដាច់ដោយឡែក។", revenueTrend: "និន្នាការចំណូលជា USD",
        booked: "បានកក់", paid: "បានបង់", total: "សរុប", noStatus: "មិនមានសកម្មភាពស្ថានភាព", statusValues: "តម្លៃស្ថានភាព",
      },
      notFound: {
        eyebrow: "404 · រកមិនឃើញទំព័រអ្នកគ្រប់គ្រង", title: "ផ្ទាំងការងារនេះមិនមានទេ។",
        description: "តំណអ្នកគ្រប់គ្រងអាចហួសសម័យ ឬម៉ូឌុលអាចត្រូវបានផ្លាស់ទី។ សូមត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង ឬបន្តគ្រប់គ្រងយានយន្ត។",
        dashboard: "ផ្ទាំងគ្រប់គ្រង", vehicles: "មើលយានយន្ត", imageAlt: "ម៉ូតូ RideGo នៅក្បែរផ្លូវកោង និងសញ្ញាគោលដៅដែលមិនស្គាល់",
      },
    },
  },
);
