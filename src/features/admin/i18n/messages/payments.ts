import { adminPack } from "./pack";

export default adminPack(
  {
    payments: {
      dates: { all: "Any date", "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" },
      columns: { payment: "Payment", customer: "Customer", related: "Related to", amount: "Amount", method: "Method", provider: "Provider", status: "Status", created: "Date / time" },
      booking: "Booking {reference}", refunded: " refunded", allMethods: "All methods", allCurrencies: "All currencies", loading: "Loading payments…",
      noMatches: "No payments match these filters.", empty: "No payments yet.", description: "View payment attempts for bookings and follow each one to its booking and customer.",
      loadError: "Couldn’t load payments", search: "Search payment, customer or booking…", countOne: "{count} payment", count: "{count} payments",
      showOne: "Show {count} payment", show: "Show {count} payments", filterTitle: "Filter payments",
      timeline: {
        created: "Payment created", provider_created: "Provider transaction created", paid: "Paid", failed: "Failed", refund_pending: "Refund pending",
        refund_completed: "Refund completed", refund_failed: "Refund declined",
      },
      detail: {
        notFound: "Payment not found", paymentLoadError: "Couldn’t load the payment", loadingPayment: "Loading payment…", synced: "Synchronised with ABA PayWay",
        syncError: "The PayWay record could not be refreshed.", title: "Payment {id}", createdAt: "{date} (Asia/Phnom_Penh)", sync: "Sync from PayWay", refund: "Refund Payment",
        refundUnavailable: "Refund unavailable: {reason}", transaction: "Transaction", transactionId: "PayWay transaction ID", status: "Status", provider: "Provider",
        method: "Payment method", notReported: "Not reported yet", providerStatus: "Provider status", approvalCode: "Approval code", bankRef: "Bank reference",
        payerAccount: "Payer account", bank: "Bank", cardSource: "Card source", transactionDate: "Transaction date", paid: "Paid", providerNote: "Provider note",
        lastSynced: "Last synchronised", notSynced: "Not synchronised yet", customer: "Customer", view: "View", relatedBooking: "Related Booking", viewBooking: "View Booking",
        refunds: "Refunds", refundStatus: { pending: "pending", completed: "completed", failed: "failed" }, noRefunds: "No refunds have been made for this payment.",
        operations: "PayWay operations", timeline: "Payment Timeline", amount: "Amount", original: "Original amount", paidAmount: "Paid amount", refundedAmount: "Refunded amount",
        remaining: "Remaining refundable", fee: "Processing fee", feeMissing: "Not provided by PayWay", net: "Net after refunds", netHint: "Paid amount − refunded amount",
      },
      refund: {
        maxAmount: "At most {amount} {currency} can still be refunded.", processed: "Refund processed", submitted: "Refund submitted",
        error: "Something went wrong. Check the payment before trying again.", paidAmount: "Paid amount", alreadyRefunded: "Already refunded", remaining: "Remaining refundable",
        amount: "Refund amount ({currency})", amountHint: "Refund the full remaining amount or any part of it. Further partial refunds stay possible until the paid amount is returned.",
        reason: "Reason / admin note", reasonPlaceholder: "Why is this payment being refunded?",
        hint: "The refund goes to the payer through ABA PayWay. It does not cancel the booking or release the vehicle.", notProcessed: "Refund was not processed",
        process: "Process Refund", title: "Refund Payment",
      },
      validation: { amount: "Enter the amount to refund.", positive: "Enter an amount greater than zero.", decimals: "Use at most two decimal places.", reasonMin: "Enter a reason (at least 2 characters).", reasonMax: "Keep the reason under 300 characters." },
    },
  },
  {
    payments: {
      dates: { all: "កាលបរិច្ឆេទណាមួយ", "7": "៧ ថ្ងៃចុងក្រោយ", "30": "៣០ ថ្ងៃចុងក្រោយ", "90": "៩០ ថ្ងៃចុងក្រោយ" },
      columns: { payment: "ការទូទាត់", customer: "អតិថិជន", related: "ទាក់ទងនឹង", amount: "ចំនួនទឹកប្រាក់", method: "វិធីសាស្ត្រ", provider: "អ្នកផ្តល់សេវា", status: "ស្ថានភាព", created: "កាលបរិច្ឆេទ / ម៉ោង" },
      booking: "ការកក់ {reference}", refunded: " បានសង", allMethods: "វិធីសាស្ត្រទាំងអស់", allCurrencies: "រូបិយប័ណ្ណទាំងអស់", loading: "កំពុងផ្ទុកការទូទាត់…",
      noMatches: "គ្មានការទូទាត់ដែលត្រូវនឹងតម្រងទាំងនេះទេ។", empty: "មិនទាន់មានការទូទាត់។", description: "មើលការព្យាយាមទូទាត់សម្រាប់ការកក់ ហើយតាមដានការទូទាត់នីមួយៗទៅកាន់ការកក់ និងអតិថិជន។",
      loadError: "មិនអាចផ្ទុកការទូទាត់បាន", search: "ស្វែងរកការទូទាត់ អតិថិជន ឬការកក់…", countOne: "ការទូទាត់ {count}", count: "ការទូទាត់ {count}",
      showOne: "បង្ហាញការទូទាត់ {count}", show: "បង្ហាញការទូទាត់ {count}", filterTitle: "តម្រងការទូទាត់",
      timeline: {
        created: "បានបង្កើតការទូទាត់", provider_created: "អ្នកផ្តល់សេវាបានបង្កើតប្រតិបត្តិការ", paid: "បានបង់", failed: "បរាជ័យ", refund_pending: "ការសងប្រាក់កំពុងរង់ចាំ",
        refund_completed: "ការសងប្រាក់បានបញ្ចប់", refund_failed: "ការសងប្រាក់ត្រូវបានបដិសេធ",
      },
      detail: {
        notFound: "រកមិនឃើញការទូទាត់", paymentLoadError: "មិនអាចផ្ទុកការទូទាត់បាន", loadingPayment: "កំពុងផ្ទុកការទូទាត់…", synced: "បានធ្វើសមកាលកម្មជាមួយ ABA PayWay",
        syncError: "មិនអាចធ្វើបច្ចុប្បន្នភាពកំណត់ត្រា PayWay បានទេ។", title: "ការទូទាត់ {id}", createdAt: "{date} (Asia/Phnom_Penh)", sync: "ធ្វើសមកាលកម្មពី PayWay", refund: "សងប្រាក់វិញ",
        refundUnavailable: "មិនអាចសងប្រាក់បាន៖ {reason}", transaction: "ប្រតិបត្តិការ", transactionId: "លេខសម្គាល់ប្រតិបត្តិការ PayWay", status: "ស្ថានភាព", provider: "អ្នកផ្តល់សេវា",
        method: "វិធីសាស្ត្រទូទាត់", notReported: "មិនទាន់មានរបាយការណ៍", providerStatus: "ស្ថានភាពអ្នកផ្តល់សេវា", approvalCode: "លេខកូដអនុម័ត", bankRef: "លេខយោងធនាគារ",
        payerAccount: "គណនីអ្នកបង់", bank: "ធនាគារ", cardSource: "ប្រភពកាត", transactionDate: "កាលបរិច្ឆេទប្រតិបត្តិការ", paid: "បានបង់", providerNote: "កំណត់ចំណាំអ្នកផ្តល់សេវា",
        lastSynced: "សមកាលកម្មចុងក្រោយ", notSynced: "មិនទាន់ធ្វើសមកាលកម្ម", customer: "អតិថិជន", view: "មើល", relatedBooking: "ការកក់ពាក់ព័ន្ធ", viewBooking: "មើលការកក់",
        refunds: "ការសងប្រាក់", refundStatus: { pending: "កំពុងរង់ចាំ", completed: "បានបញ្ចប់", failed: "បរាជ័យ" }, noRefunds: "មិនទាន់មានការសងប្រាក់សម្រាប់ការទូទាត់នេះទេ។",
        operations: "ប្រតិបត្តិការ PayWay", timeline: "ពេលវេលានៃការទូទាត់", amount: "ចំនួនទឹកប្រាក់", original: "ចំនួនដើម", paidAmount: "ចំនួនបានបង់", refundedAmount: "ចំនួនបានសង",
        remaining: "ចំនួននៅសល់ដែលអាចសងបាន", fee: "ថ្លៃដំណើរការ", feeMissing: "PayWay មិនបានផ្តល់", net: "សុទ្ធក្រោយការសងប្រាក់", netHint: "ចំនួនបានបង់ − ចំនួនបានសង",
      },
      refund: {
        maxAmount: "អាចសងបានច្រើនបំផុត {amount} {currency} ទៀតប៉ុណ្ណោះ។", processed: "បានដំណើរការការសងប្រាក់", submitted: "បានដាក់ស្នើការសងប្រាក់",
        error: "មានបញ្ហាកើតឡើង។ សូមពិនិត្យការទូទាត់មុនពេលព្យាយាមម្តងទៀត។", paidAmount: "ចំនួនបានបង់", alreadyRefunded: "បានសងរួច", remaining: "ចំនួននៅសល់ដែលអាចសងបាន",
        amount: "ចំនួនសងប្រាក់ ({currency})", amountHint: "សងចំនួននៅសល់ទាំងអស់ ឬផ្នែកណាមួយ។ ការសងប្រាក់មួយផ្នែកបន្ថែមអាចធ្វើបាន រហូតដល់ចំនួនបានបង់ត្រូវបានសងវិញទាំងអស់។",
        reason: "មូលហេតុ / កំណត់ចំណាំអ្នកគ្រប់គ្រង", reasonPlaceholder: "ហេតុអ្វីបានជាសងប្រាក់សម្រាប់ការទូទាត់នេះ?",
        hint: "ប្រាក់សងនឹងត្រូវផ្ញើទៅអ្នកបង់តាមរយៈ ABA PayWay។ វាមិនលុបចោលការកក់ ឬដោះលែងយានយន្តទេ។", notProcessed: "មិនបានដំណើរការការសងប្រាក់ទេ",
        process: "ដំណើរការការសងប្រាក់", title: "សងប្រាក់វិញ",
      },
      validation: { amount: "សូមបញ្ចូលចំនួនទឹកប្រាក់ដែលត្រូវសង។", positive: "សូមបញ្ចូលចំនួនធំជាងសូន្យ។", decimals: "ប្រើខ្ទង់ទសភាគយ៉ាងច្រើនពីរខ្ទង់។", reasonMin: "សូមបញ្ចូលមូលហេតុ (យ៉ាងហោចណាស់ 2 តួអក្សរ)។", reasonMax: "មូលហេតុត្រូវមានតិចជាង 300 តួអក្សរ។" },
    },
  },
);
