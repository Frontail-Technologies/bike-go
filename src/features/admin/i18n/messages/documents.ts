import { adminPack } from "./pack";

export default adminPack(
  {
    documents: {
      dates: { all: "Any upload date", "7": "Last 7 days", "30": "Last 30 days", "90": "Last 90 days" },
      columns: { applicant: "Applicant", loan: "Loan application", document: "Document", uploaded: "Uploaded at", status: "Status", reviewer: "Reviewed by" },
      loanType: "{type} loan", actionsFor: "Actions for {type} of {name}", actions: "Document actions", openDocument: "Open document", review: "Review",
      openLoan: "Open Loan Application", allTypes: "All document types", loading: "Loading documents…", noMatches: "No documents match these filters.",
      empty: "No documents have been uploaded yet.", queue: "Review queue summary", countOne: "{count} document", count: "{count} documents",
      showOne: "Show {count} document", show: "Show {count} documents", filterTitle: "Filter documents",
      decision: {
        verified: { label: "Verify document", placeholder: "Optional note" },
        needs_review: { label: "Mark as needs review", placeholder: "What should be checked again?" },
        rejected: { label: "Reject document", placeholder: "Image is blurred. Please upload a clearer passport copy." },
      },
      toast: { verified: "{type} verified", rejected: "{type} rejected", needs_review: "{type} marked as needs review" },
      reasonRequired: "Reason (required)", noteOptional: "Note (optional)", notSaved: "Review was not saved", back: "Back",
      history: { uploaded: "Uploaded", verified: "Verified", rejected: "Rejected", needsReview: "Marked needs review", by: "by {name}", submitted: "Submitted with the loan application." },
      pdfHint: "PDF document. Open it to read every page.", imageHint: "Open the file to inspect the image.", open: "Open Document", applicant: "Applicant",
      loanReference: "Loan reference", type: "Document type", currentStatus: "Current status", filename: "Original filename", uploaded: "Uploaded",
      timezone: "{date} (Asia/Phnom_Penh)", reviewHistory: "Review history", openLoanApplication: "Open loan application", verify: "Verify", needsReview: "Needs Review",
      reject: "Reject", reviewDocument: "Review document", document: "Document", notFound: "Document not found", loadError: "Couldn’t load the document",
      loadingDocument: "Loading document",
      validation: { noteMax: "Keep the note under 300 characters.", reason: "Add a reason so the applicant knows what to fix.", noteMin: "Enter at least 2 characters, or leave it empty." },
    },
  },
  {
    documents: {
      dates: { all: "កាលបរិច្ឆេទផ្ទុកឡើងណាមួយ", "7": "៧ ថ្ងៃចុងក្រោយ", "30": "៣០ ថ្ងៃចុងក្រោយ", "90": "៩០ ថ្ងៃចុងក្រោយ" },
      columns: { applicant: "អ្នកដាក់ពាក្យ", loan: "ពាក្យស្នើសុំកម្ចី", document: "ឯកសារ", uploaded: "ពេលផ្ទុកឡើង", status: "ស្ថានភាព", reviewer: "ពិនិត្យដោយ" },
      loanType: "{type}", actionsFor: "សកម្មភាពសម្រាប់ {type} របស់ {name}", actions: "សកម្មភាពឯកសារ", openDocument: "បើកឯកសារ", review: "ពិនិត្យ",
      openLoan: "បើកពាក្យស្នើសុំកម្ចី", allTypes: "ប្រភេទឯកសារទាំងអស់", loading: "កំពុងផ្ទុកឯកសារ…", noMatches: "គ្មានឯកសារដែលត្រូវនឹងតម្រងទាំងនេះទេ។",
      empty: "មិនទាន់មានឯកសារត្រូវបានផ្ទុកឡើងទេ។", queue: "សេចក្តីសង្ខេបជួរពិនិត្យ", countOne: "ឯកសារ {count}", count: "ឯកសារ {count}",
      showOne: "បង្ហាញឯកសារ {count}", show: "បង្ហាញឯកសារ {count}", filterTitle: "តម្រងឯកសារ",
      decision: {
        verified: { label: "ផ្ទៀងផ្ទាត់ឯកសារ", placeholder: "កំណត់ចំណាំ (ស្រេចចិត្ត)" },
        needs_review: { label: "សម្គាល់ថាត្រូវការពិនិត្យ", placeholder: "តើគួរពិនិត្យអ្វីម្តងទៀត?" },
        rejected: { label: "បដិសេធឯកសារ", placeholder: "រូបភាពព្រិល។ សូមផ្ទុកច្បាប់ចម្លងលិខិតឆ្លងដែនដែលច្បាស់ជាងនេះ។" },
      },
      toast: { verified: "បានផ្ទៀងផ្ទាត់ {type}", rejected: "បានបដិសេធ {type}", needs_review: "បានសម្គាល់ {type} ថាត្រូវការពិនិត្យ" },
      reasonRequired: "មូលហេតុ (តម្រូវ)", noteOptional: "កំណត់ចំណាំ (ស្រេចចិត្ត)", notSaved: "មិនបានរក្សាទុកការពិនិត្យទេ", back: "ត្រឡប់ក្រោយ",
      history: { uploaded: "បានផ្ទុកឡើង", verified: "បានផ្ទៀងផ្ទាត់", rejected: "បានបដិសេធ", needsReview: "បានសម្គាល់ថាត្រូវការពិនិត្យ", by: "ដោយ {name}", submitted: "បានដាក់ជាមួយពាក្យស្នើសុំកម្ចី។" },
      pdfHint: "ឯកសារ PDF។ បើកវាដើម្បីអានគ្រប់ទំព័រ។", imageHint: "បើកឯកសារដើម្បីពិនិត្យរូបភាព។", open: "បើកឯកសារ", applicant: "អ្នកដាក់ពាក្យ",
      loanReference: "លេខយោងកម្ចី", type: "ប្រភេទឯកសារ", currentStatus: "ស្ថានភាពបច្ចុប្បន្ន", filename: "ឈ្មោះឯកសារដើម", uploaded: "បានផ្ទុកឡើង",
      timezone: "{date} (Asia/Phnom_Penh)", reviewHistory: "ប្រវត្តិពិនិត្យ", openLoanApplication: "បើកពាក្យស្នើសុំកម្ចី", verify: "ផ្ទៀងផ្ទាត់", needsReview: "ត្រូវការពិនិត្យ",
      reject: "បដិសេធ", reviewDocument: "ពិនិត្យឯកសារ", document: "ឯកសារ", notFound: "រកមិនឃើញឯកសារ", loadError: "មិនអាចផ្ទុកឯកសារបាន",
      loadingDocument: "កំពុងផ្ទុកឯកសារ",
      validation: { noteMax: "កំណត់ចំណាំត្រូវមានតិចជាង 300 តួអក្សរ។", reason: "សូមបន្ថែមមូលហេតុ ដើម្បីឱ្យអ្នកដាក់ពាក្យដឹងថាត្រូវកែអ្វី។", noteMin: "សូមបញ្ចូលយ៉ាងហោចណាស់ 2 តួអក្សរ ឬទុកឱ្យនៅទទេ។" },
    },
  },
);
