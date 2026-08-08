/** Default UI base URL (override with BASE_URL in .env). */
export const DEFAULT_BASE_HOST = 'www.automationexercise.com';
export const DEFAULT_BASE_URL = 'https://www.automationexercise.com';

/** REST paths (Automation Exercise API list). */
export const API_PRODUCTS_LIST_PATH = '/api/productsList';
export const API_SEARCH_PRODUCT_PATH = '/api/searchProduct';
export const API_CREATE_ACCOUNT_PATH = '/api/createAccount';
export const API_DELETE_ACCOUNT_PATH = '/api/deleteAccount';
/** API 7 / 10 — verifyLogin (used as the seeding precondition guard, TC-01). */
export const API_VERIFY_LOGIN_PATH = '/api/verifyLogin';

/** UI routes. Header clicks are ad-intercepted on this site (defect D2), so paths are needed. */
export const UI_PATH_HOME = '/';
export const UI_PATH_LOGIN = '/login';
export const UI_PATH_PRODUCTS = '/products';
export const UI_PATH_CART = '/view_cart';

/** API body `responseCode` values (site JSON; HTTP status is often 200 for all). */
export const API_RESPONSE_CODE_OK = 200;
/** createAccount success code (HTTP stays 200; body carries 201). */
export const API_RESPONSE_CODE_CREATED = 201;
/** Current JSON error code on some deployments. */
export const API_RESPONSE_CODE_CLIENT_ERROR = 3;
/** Legacy JSON error code still returned on www host (API 6). */
export const API_RESPONSE_CODE_LEGACY_BAD_REQUEST = 400;

/** HTTP status codes used in API assertions. */
export const HTTP_STATUS_OK = 200;

/** Substrings expected in API 6 error message (wording varies by host). */
export const API_SEARCH_MISSING_PARAM_MESSAGE_MARKERS = ['search_product', 'missing'] as const;

/** Success heading after full registration (Automation Exercise). */
export const ACCOUNT_CREATED_HEADING = 'Account Created!';

/** Login failure copy from site (Test Case 3). */
export const LOGIN_ERROR_INCORRECT = 'Your email or password is incorrect!';

/**
 * Authentication capability copy — verified against the live DOM.
 * REQ-AUT-01 headings, the header session indicator and the logged-out control.
 */
export const LOGIN_SECTION_HEADING = 'Login to your account';
export const NEW_USER_SIGNUP_HEADING = 'New User Signup!';
export const LOGGED_IN_AS_TEXT = 'Logged in as';
export const SIGNUP_LOGIN_LINK_LABEL = 'Signup / Login';
export const LOGOUT_LINK_LABEL = 'Logout';

/** API 7 / 10 body messages (verifyLogin). */
export const API_MESSAGE_USER_EXISTS = 'User exists!';
export const API_MESSAGE_USER_NOT_FOUND = 'User not found!';
/** verifyLogin body code for credentials matching no account (API 10). */
export const API_RESPONSE_CODE_NOT_FOUND = 404;

/** Search keyword with stable inventory on the demo shop. */
export const SEARCH_KEYWORD_TSHIRT = 'Tshirt';

/** Deliberately empty-result style query for negative search. */
export const SEARCH_KEYWORD_NO_RESULTS = '___no_such_product_zzzz___';

/** Wrong password for negative login (never a real account password). */
export const WRONG_PASSWORD_PLACEHOLDER = 'WrongPassword!12345';

/** Default country label for signup address form. */
export const DEFAULT_COUNTRY_LABEL = 'United States';

/** Task 4 — checkout / order confirmation copy (Automation Exercise). */
export const ORDER_CONFIRMATION_TEXT = 'Congratulations! Your order has been confirmed!';
export const ORDER_PLACED_HEADING = 'Order Placed!';
export const DOWNLOAD_INVOICE_LABEL = 'Download Invoice';

/* ─── Security baseline (REQ-SEC-*) ─── */

/** Additional REST paths the security baseline exercises (API 3, API 14). */
export const API_BRANDS_LIST_PATH = '/api/brandsList';
export const API_USER_DETAIL_PATH = '/api/getUserDetailByEmail';

/** Routes that must require a session (REQ-SEC-14, REQ-SEC-15). */
export const UI_PATH_CHECKOUT = '/checkout';
export const UI_PATH_PAYMENT = '/payment';
export const UI_PATH_DELETE_ACCOUNT = '/delete_account';

/** Plain-HTTP origin, used to prove the HTTPS redirect (REQ-SEC-01). */
export const INSECURE_ORIGIN_URL = `http://${DEFAULT_BASE_HOST}/`;

/** An origin the site has no relationship with, used to prove no CORS grant (REQ-SEC-08). */
export const FOREIGN_ORIGIN_URL = 'https://foreign-origin.example';

/** Response header names asserted by the security baseline. */
export const HEADER_FRAME_OPTIONS = 'x-frame-options';
export const HEADER_CONTENT_TYPE_OPTIONS = 'x-content-type-options';
export const HEADER_REFERRER_POLICY = 'referrer-policy';
export const HEADER_CONTENT_SECURITY_POLICY = 'content-security-policy';
export const HEADER_STRICT_TRANSPORT_SECURITY = 'strict-transport-security';
export const HEADER_POWERED_BY = 'x-powered-by';
export const HEADER_ACCESS_CONTROL_ALLOW_ORIGIN = 'access-control-allow-origin';
export const HEADER_LOCATION = 'location';

/** Expected values for the headers above. */
export const FRAME_OPTIONS_DENY = 'DENY';
export const CONTENT_TYPE_OPTIONS_NOSNIFF = 'nosniff';

/** Name of the cookie carrying the authenticated session (REQ-SEC-05 … REQ-SEC-07). */
export const SESSION_COOKIE_NAME = 'sessionid';
/** `SameSite` value that would defeat the cross-site protection REQ-SEC-05 requires. */
export const SAME_SITE_NONE = 'None';

/** HTTP status codes asserted outside the `responseCode` convention. */
export const HTTP_STATUS_MOVED_PERMANENTLY = 301;

/** API body `responseCode` for an unsupported method (API 2 / 4 / 9). */
export const API_RESPONSE_CODE_METHOD_NOT_ALLOWED = 405;
/** Site copy returned with that code — part of the published contract, so asserted verbatim. */
export const API_METHOD_NOT_ALLOWED_MESSAGE = 'This request method is not supported.';
/** Substrings expected in the API 8 error message (wording varies by host). */
export const API_VERIFY_LOGIN_MISSING_PARAM_MARKERS = ['email or password', 'missing'] as const;

/** Copy that must never be served to a caller with no session (REQ-SEC-14, REQ-SEC-15). */
export const CHECKOUT_PLACE_ORDER_LABEL = 'Place Order';
export const PAYMENT_CARD_NUMBER_FIELD = 'card_number';
export const ACCOUNT_DELETED_HEADING = 'Account Deleted!';

/**
 * Text that would betray a leaked database error or stack trace in a response body
 * (REQ-SEC-09). Lower-cased before comparison at the call site.
 */
export const ERROR_LEAK_MARKERS = [
  'sql',
  'syntax error',
  'traceback',
  'stack trace',
  'exception',
] as const;

/** Default timeouts (ms). */
export const DEFAULT_EXPECT_TIMEOUT_MS = 25_000;
export const DEFAULT_ACTION_TIMEOUT_MS = 20_000;

/** Fixed browser context for repeatable UI runs. */
export const DEFAULT_VIEWPORT = { width: 1280, height: 720 } as const;
export const DEFAULT_LOCALE = 'en-US';
export const DEFAULT_TIMEZONE = 'UTC';
