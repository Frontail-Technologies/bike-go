import { adminPack } from "./pack";

export default adminPack(
  {
    settings: {
      tabs: { label: "Settings sections", vehicle: "Vehicle Masters", booking: "Booking Masters", loan: "Loan Masters", pricing: "Pricing & Tax", rules: "System Rules" },
      sections: {
        vehicleTypes: { title: "Vehicle Types", description: "Top-level groups used when adding vehicles.", noun: "vehicle type" },
        categories: { title: "Vehicle Categories", description: "Segments such as cruiser or commuter, shown with an image.", noun: "category" },
        brands: { title: "Brands", description: "Manufacturers available in the vehicle form.", noun: "brand" },
        transmissions: { title: "Transmission Types", description: "Gearbox options.", noun: "transmission" },
        fuelTypes: { title: "Fuel Types", description: "Fuel and power options.", noun: "fuel type" },
        blockReasons: { title: "Availability Block Reasons", description: "Reasons offered when blocking a vehicle.", noun: "reason" },
        loanTypes: { title: "Loan Types", description: "Standalone loan products customers can apply for.", noun: "loan type" },
        bookingStatuses: { title: "Booking Statuses", description: "System workflow states. They can’t be renamed, reordered or removed." },
        documentTypes: { title: "Document Types", description: "Reference list of documents applicants can be asked to provide. Not configurable." },
        loanStatuses: { title: "Loan Statuses", description: "System workflow states. They can’t be renamed or reordered." },
      },
      pricing: {
        loadError: "Couldn’t load pricing", note: "These values are set by system configuration, so they can’t be edited here.", vat: "VAT rate", vatHint: "Applied to rental charges.",
        platformFee: "Platform fee", platformFeeHint: "Added to each booking, in USD.", hold: "Booking hold", holdHint: "How long a pending booking keeps its vehicle.", minutes: "{count} minutes",
      },
      rules: {
        loadError: "Couldn’t load system rules", currency: "Currency", currencyHint: "Prices and totals are shown in US dollars.", systemRule: "System rule", timezone: "Timezone",
        timezoneHint: "Dates and times use Cambodia time (ICT, UTC+7).", holdHint: "Unpaid reservations expire automatically.", uploadLimits: "Upload limits", loanDocuments: "Loan documents",
        images: "Images", each: "{size} each", provider: "Payment provider", enabled: "Enabled", notEnabled: "Not enabled", live: "Live", deferred: "Deferred",
        liveHint: "Customers can pay for bookings online.", deferredHint: "Online payments are not switched on yet.",
      },
      systemConfigured: "System configured", loading: "Loading",
      actions: { actionsFor: "Actions for {name}", edit: "Edit", moveUp: "Move up", moveDown: "Move down", delete: "Delete" },
      deactivateCopy: "{name} will stay on existing records, but it can’t be picked for new ones. You can activate it again later.",
      master: {
        active: "Active", inactive: "Inactive", updated: "{name} updated", added: "{name} added", activated: "{name} activated", deactivated: "{name} deactivated", deleted: "{name} deleted",
        add: "Add {noun}", search: "Search {title}…", loadError: "Couldn’t load {title}", loading: "Loading {title}", noMatches: "No {title} match these filters.", empty: "No {title} yet. Add the first one.",
        deactivateTitle: "Deactivate {name}?", thisItem: "This item", deleteTitle: "Delete {name}?",
        deleteDescription: "This cannot be undone. Vehicles or loans that already used “{name}” keep that text; only new selections are affected.", thisItemLower: "this item",
      },
      dialog: {
        saveError: "Couldn’t save. Try again.", notSaved: "Not saved", name: "Name", code: "Code", codePlaceholder: "generated from the name", codeHint: "Used internally. Leave empty to generate it.",
        image: "Image", categoryImage: "Category image", replaceImage: "Replace image", remove: "Remove", upload: "Upload {noun} image", uploadHint: "JPG, PNG or WebP · up to 5 MB",
        active: "Active", activeHint: "Inactive items stay on existing records but can’t be picked for new ones.", save: "Save", edit: "Edit {noun}", add: "Add {noun}",
      },
      addons: {
        updated: "{name} updated", added: "{name} added", codeLocked: "The code can’t be changed after the add-on is created.",
        codeHint: "Upper-case letters, digits and underscores. Leave empty to generate it.", description: "Description", price: "Price per day (USD)", activated: "{name} activated",
        deactivated: "{name} deactivated", title: "Add-ons", subtitle: "Extras customers can add to a booking, priced per day in USD.", add: "Add add-on", search: "Search add-ons…",
        loadError: "Couldn’t load add-ons", loading: "Loading add-ons", noMatches: "No add-ons match this search.", empty: "No add-ons yet. Add the first one.", perDay: "per day",
        edit: "Edit add-on", deactivateTitle: "Deactivate {name}?", addon: "add-on", thisAddon: "This add-on",
      },
      validation: { lowerCode: "Use lower-case letters, digits and underscores.", upperCode: "Use upper-case letters, digits and underscores.", price: "Enter a price greater than zero." },
    },
  },
  {
    settings: {
      tabs: { label: "ផ្នែកការកំណត់", vehicle: "ទិន្នន័យយានយន្ត", booking: "ទិន្នន័យការកក់", loan: "ទិន្នន័យកម្ចី", pricing: "តម្លៃ និងពន្ធ", rules: "ច្បាប់ប្រព័ន្ធ" },
      sections: {
        vehicleTypes: { title: "ប្រភេទយានយន្ត", description: "ក្រុមកម្រិតខ្ពស់ដែលប្រើនៅពេលបន្ថែមយានយន្ត។", noun: "ប្រភេទយានយន្ត" },
        categories: { title: "ប្រភេទរងយានយន្ត", description: "ផ្នែកដូចជា cruiser ឬ commuter ដែលបង្ហាញជាមួយរូបភាព។", noun: "ប្រភេទរង" },
        brands: { title: "ម៉ាក", description: "ក្រុមហ៊ុនផលិតដែលមាននៅក្នុងទម្រង់យានយន្ត។", noun: "ម៉ាក" },
        transmissions: { title: "ប្រភេទប្រអប់លេខ", description: "ជម្រើសប្រអប់លេខ។", noun: "ប្រអប់លេខ" },
        fuelTypes: { title: "ប្រភេទឥន្ធនៈ", description: "ជម្រើសឥន្ធនៈ និងថាមពល។", noun: "ប្រភេទឥន្ធនៈ" },
        blockReasons: { title: "មូលហេតុបិទមិនឱ្យជួល", description: "មូលហេតុដែលផ្តល់ជូននៅពេលបិទយានយន្ត។", noun: "មូលហេតុ" },
        loanTypes: { title: "ប្រភេទកម្ចី", description: "ផលិតផលកម្ចីដាច់ដោយឡែកដែលអតិថិជនអាចដាក់ពាក្យបាន។", noun: "ប្រភេទកម្ចី" },
        bookingStatuses: { title: "ស្ថានភាពការកក់", description: "ស្ថានភាពលំហូរការងាររបស់ប្រព័ន្ធ។ មិនអាចប្តូរឈ្មោះ តម្រៀបឡើងវិញ ឬលុបបានទេ។" },
        documentTypes: { title: "ប្រភេទឯកសារ", description: "បញ្ជីយោងនៃឯកសារដែលអ្នកដាក់ពាក្យអាចត្រូវបានស្នើឱ្យផ្តល់។ មិនអាចកំណត់បានទេ។" },
        loanStatuses: { title: "ស្ថានភាពកម្ចី", description: "ស្ថានភាពលំហូរការងាររបស់ប្រព័ន្ធ។ មិនអាចប្តូរឈ្មោះ ឬតម្រៀបឡើងវិញបានទេ។" },
      },
      pricing: {
        loadError: "មិនអាចផ្ទុកតម្លៃបាន", note: "តម្លៃទាំងនេះត្រូវបានកំណត់ដោយការកំណត់រចនាសម្ព័ន្ធប្រព័ន្ធ ដូច្នេះមិនអាចកែសម្រួលនៅទីនេះបានទេ។", vat: "អត្រាអាករលើតម្លៃបន្ថែម", vatHint: "អនុវត្តលើថ្លៃជួល។",
        platformFee: "ថ្លៃសេវាប្រព័ន្ធ", platformFeeHint: "បន្ថែមលើការកក់នីមួយៗ ជា USD។", hold: "ការរក្សាទុកការកក់", holdHint: "រយៈពេលដែលការកក់កំពុងរង់ចាំរក្សាយានយន្តទុក។", minutes: "{count} នាទី",
      },
      rules: {
        loadError: "មិនអាចផ្ទុកច្បាប់ប្រព័ន្ធបាន", currency: "រូបិយប័ណ្ណ", currencyHint: "តម្លៃ និងសរុបត្រូវបានបង្ហាញជាដុល្លារអាមេរិក។", systemRule: "ច្បាប់ប្រព័ន្ធ", timezone: "ល្វែងម៉ោង",
        timezoneHint: "កាលបរិច្ឆេទ និងម៉ោងប្រើម៉ោងកម្ពុជា (ICT, UTC+7)។", holdHint: "ការកក់ដែលមិនទាន់បង់នឹងផុតកំណត់ដោយស្វ័យប្រវត្តិ។", uploadLimits: "ដែនកំណត់ការផ្ទុកឡើង", loanDocuments: "ឯកសារកម្ចី",
        images: "រូបភាព", each: "{size} ក្នុងមួយរូប", provider: "អ្នកផ្តល់សេវាទូទាត់", enabled: "បានបើក", notEnabled: "មិនទាន់បើក", live: "កំពុងដំណើរការ", deferred: "ពន្យារពេល",
        liveHint: "អតិថិជនអាចបង់ប្រាក់សម្រាប់ការកក់តាមអនឡាញ។", deferredHint: "ការទូទាត់តាមអនឡាញមិនទាន់បើកនៅឡើយទេ។",
      },
      systemConfigured: "កំណត់ដោយប្រព័ន្ធ", loading: "កំពុងផ្ទុក",
      actions: { actionsFor: "សកម្មភាពសម្រាប់ {name}", edit: "កែសម្រួល", moveUp: "ផ្លាស់ទៅលើ", moveDown: "ផ្លាស់ទៅក្រោម", delete: "លុប" },
      deactivateCopy: "{name} នឹងនៅតែមាននៅលើកំណត់ត្រាដែលមានស្រាប់ ប៉ុន្តែមិនអាចជ្រើសរើសសម្រាប់កំណត់ត្រាថ្មីបានទេ។ អ្នកអាចធ្វើឱ្យវាសកម្មម្តងទៀតនៅពេលក្រោយ។",
      master: {
        active: "សកម្ម", inactive: "អសកម្ម", updated: "បានធ្វើបច្ចុប្បន្នភាព {name}", added: "បានបន្ថែម {name}", activated: "បានធ្វើឱ្យ {name} សកម្ម", deactivated: "បានបិទ {name}", deleted: "បានលុប {name}",
        add: "បន្ថែម{noun}", search: "ស្វែងរក{title}…", loadError: "មិនអាចផ្ទុក{title}បាន", loading: "កំពុងផ្ទុក{title}", noMatches: "គ្មាន{title}ដែលត្រូវនឹងតម្រងទាំងនេះទេ។", empty: "មិនទាន់មាន{title}ទេ។ បន្ថែមមួយដំបូង។",
        deactivateTitle: "បិទ {name}?", thisItem: "ធាតុនេះ", deleteTitle: "លុប {name}?",
        deleteDescription: "សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។ យានយន្ត ឬកម្ចីដែលបានប្រើ “{name}” រួចហើយនឹងរក្សាអត្ថបទនោះ មានតែការជ្រើសរើសថ្មីប៉ុណ្ណោះដែលរងផលប៉ះពាល់។", thisItemLower: "ធាតុនេះ",
      },
      dialog: {
        saveError: "មិនអាចរក្សាទុកបានទេ។ សូមព្យាយាមម្តងទៀត។", notSaved: "មិនបានរក្សាទុកទេ", name: "ឈ្មោះ", code: "កូដ", codePlaceholder: "បង្កើតពីឈ្មោះ", codeHint: "ប្រើផ្ទៃក្នុង។ ទុកទទេដើម្បីបង្កើតដោយស្វ័យប្រវត្តិ។",
        image: "រូបភាព", categoryImage: "រូបភាពប្រភេទរង", replaceImage: "ជំនួសរូបភាព", remove: "ដកចេញ", upload: "ផ្ទុករូបភាព{noun}ឡើង", uploadHint: "JPG, PNG ឬ WebP · រហូតដល់ 5 MB",
        active: "សកម្ម", activeHint: "ធាតុអសកម្មនៅតែមាននៅលើកំណត់ត្រាដែលមានស្រាប់ ប៉ុន្តែមិនអាចជ្រើសរើសសម្រាប់កំណត់ត្រាថ្មីបានទេ។", save: "រក្សាទុក", edit: "កែសម្រួល{noun}", add: "បន្ថែម{noun}",
      },
      addons: {
        updated: "បានធ្វើបច្ចុប្បន្នភាព {name}", added: "បានបន្ថែម {name}", codeLocked: "មិនអាចប្តូរកូដបានទេ បន្ទាប់ពីបង្កើតសេវាបន្ថែមរួច។",
        codeHint: "អក្សរធំ លេខ និងសញ្ញា _។ ទុកទទេដើម្បីបង្កើតដោយស្វ័យប្រវត្តិ។", description: "ការពិពណ៌នា", price: "តម្លៃក្នុងមួយថ្ងៃ (USD)", activated: "បានធ្វើឱ្យ {name} សកម្ម",
        deactivated: "បានបិទ {name}", title: "សេវាបន្ថែម", subtitle: "សេវាបន្ថែមដែលអតិថិជនអាចបន្ថែមទៅការកក់ គិតតម្លៃក្នុងមួយថ្ងៃជា USD។", add: "បន្ថែមសេវាបន្ថែម", search: "ស្វែងរកសេវាបន្ថែម…",
        loadError: "មិនអាចផ្ទុកសេវាបន្ថែមបាន", loading: "កំពុងផ្ទុកសេវាបន្ថែម", noMatches: "គ្មានសេវាបន្ថែមដែលត្រូវនឹងការស្វែងរកនេះទេ។", empty: "មិនទាន់មានសេវាបន្ថែមទេ។ បន្ថែមមួយដំបូង។", perDay: "ក្នុងមួយថ្ងៃ",
        edit: "កែសម្រួលសេវាបន្ថែម", deactivateTitle: "បិទ {name}?", addon: "សេវាបន្ថែម", thisAddon: "សេវាបន្ថែមនេះ",
      },
      validation: { lowerCode: "ប្រើអក្សរតូច លេខ និងសញ្ញា _។", upperCode: "ប្រើអក្សរធំ លេខ និងសញ្ញា _។", price: "សូមបញ្ចូលតម្លៃធំជាងសូន្យ។" },
    },
  },
);
