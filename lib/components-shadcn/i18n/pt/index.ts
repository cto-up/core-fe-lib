import actions from "./actions";
import common from "./common";
import validation from "./validation";
import auth from "./auth";
import mfa from "./mfa";
import layout from "./layout";
import core from "./core";

/**
 * Shared SaaS i18n dictionary (pt) for components-shadcn.
 *
 * Pure shell/admin namespaces — host apps merge their own per-module
 * messages on top.
 */
export default {
  actions,
  common,
  validation,
  auth,
  mfa,
  layout,
  core,
};
