import { adminPack } from "./pack";

export default adminPack(
  {
    admins: {
      roles: { admin: "Admin", super_admin: "Super admin" },
      columns: { admin: "Admin", email: "Email", role: "Role", status: "Status", lastLogin: "Last login", created: "Created" },
      never: "Never", active: "Active", inactive: "Inactive", label: "Administrator users", actionsFor: "Actions for {name}", edit: "Edit", resetPassword: "Reset password",
      deactivateTitle: "Deactivate administrator?", activateTitle: "Activate administrator?", deactivateDescription: "Deactivation immediately revokes every active administrator session.",
      form: {
        add: "Add Admin", edit: "Edit Admin", reset: "Reset Password", fullName: "Full name", email: "Email", emailLocked: "The sign-in email can’t be changed here.",
        role: "Role", selectRole: "Select role", temporaryPassword: "Temporary password", initialPassword: "Initial password", confirmPassword: "Confirm password",
        save: "Save Changes",
      },
    },
    authValidation: {
      fullName: "Enter a full name.", email: "Enter a valid email.", emailAddress: "Enter a valid email address.", password: "Enter your password.",
      currentPassword: "Enter your current password.", minPassword: "Use at least 8 characters.", mismatch: "Passwords do not match.",
    },
  },
  {
    admins: {
      roles: { admin: "អ្នកគ្រប់គ្រង", super_admin: "អ្នកគ្រប់គ្រងជាន់ខ្ពស់" },
      columns: { admin: "អ្នកគ្រប់គ្រង", email: "អ៊ីមែល", role: "តួនាទី", status: "ស្ថានភាព", lastLogin: "ចូលចុងក្រោយ", created: "បានបង្កើត" },
      never: "មិនដែល", active: "សកម្ម", inactive: "អសកម្ម", label: "អ្នកប្រើប្រាស់ជាអ្នកគ្រប់គ្រង", actionsFor: "សកម្មភាពសម្រាប់ {name}", edit: "កែសម្រួល", resetPassword: "កំណត់ពាក្យសម្ងាត់ឡើងវិញ",
      deactivateTitle: "បិទអ្នកគ្រប់គ្រង?", activateTitle: "ធ្វើឱ្យអ្នកគ្រប់គ្រងសកម្ម?", deactivateDescription: "ការបិទនឹងដកហូតវគ្គចូលប្រើសកម្មទាំងអស់របស់អ្នកគ្រប់គ្រងភ្លាមៗ។",
      form: {
        add: "បន្ថែមអ្នកគ្រប់គ្រង", edit: "កែសម្រួលអ្នកគ្រប់គ្រង", reset: "កំណត់ពាក្យសម្ងាត់ឡើងវិញ", fullName: "ឈ្មោះពេញ", email: "អ៊ីមែល", emailLocked: "មិនអាចប្តូរអ៊ីមែលសម្រាប់ចូលប្រើនៅទីនេះបានទេ។",
        role: "តួនាទី", selectRole: "ជ្រើសរើសតួនាទី", temporaryPassword: "ពាក្យសម្ងាត់បណ្តោះអាសន្ន", initialPassword: "ពាក្យសម្ងាត់ដំបូង", confirmPassword: "បញ្ជាក់ពាក្យសម្ងាត់",
        save: "រក្សាទុកការផ្លាស់ប្តូរ",
      },
    },
    authValidation: {
      fullName: "សូមបញ្ចូលឈ្មោះពេញ។", email: "សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ។", emailAddress: "សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ។", password: "សូមបញ្ចូលពាក្យសម្ងាត់របស់អ្នក។",
      currentPassword: "សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្នរបស់អ្នក។", minPassword: "ប្រើយ៉ាងហោចណាស់ 8 តួអក្សរ។", mismatch: "ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ។",
    },
  },
);
