// frontend/src/lib/api.ts
export * from "./api/index";
import * as apiNS from "./api/index";

const api = {
  core: { apiFetch: apiNS.apiFetch, API_BASE: apiNS.API_BASE },

  auth: { login: apiNS.login },

  me: {
    get: apiNS.fetchMe,
    changePassword: apiNS.changePassword,
    mfaReset: apiNS.mfaReset,
  },

  referrals: {
    my: apiNS.fetchMyReferrals,
    create: apiNS.createReferral,
    patch: apiNS.patchReferralAgent,
    files: {
      list: apiNS.getReferralFiles,
      upload: apiNS.uploadReferralFiles,
      remove: apiNS.deleteReferralFile,
    },
  },

  admin: {
    users: {
      list: apiNS.adminListUsers,
      create: apiNS.adminCreateUser,
      remove: apiNS.adminDeleteUser,
      resetPassword: apiNS.adminResetUserPassword,
      resetMfa: apiNS.adminResetUserMfa,
      update: apiNS.adminUpdateUser,
    },
    referrals: {
      list: apiNS.adminListReferrals,
      update: apiNS.adminUpdateReferral,
      remove: apiNS.adminDeleteReferral,
    },
    announcements: {
      get: apiNS.getAnnouncements,
      put: apiNS.updateAnnouncements,
    },
  },

  audit: {
    list: apiNS.fetchActivity,
    page: apiNS.fetchAuditPage,
  },
};

export { api };
export default api;
