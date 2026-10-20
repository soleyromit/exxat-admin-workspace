/** Routes shared between screens. */
export const HISTORY_PATH = "/v2/student/history"
export const RECORD_PATH = "/v2/student/verified-record"
export const REPORTS_PATH = (role: "admin" | "director") => `/v2/${role}/reports`
