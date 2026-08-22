// ==============================================================================
// DELT — Transactional Email Engine (Resend Direct REST API)
// Production-ready email delivery with branded responsive HTML templates
// ==============================================================================
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { env, hasEmailConfig } from '@/lib/env';
// ------------------------------------------------------------------------------
// Core Email Dispatcher
// ------------------------------------------------------------------------------
function sendRawEmail(params) {
    return __awaiter(this, void 0, void 0, function () {
        var to, subject, html, text, fromAddress, msg, res, resJson, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    to = params.to, subject = params.subject, html = params.html, text = params.text;
                    fromAddress = env.email.from;
                    console.log("[DELT EMAIL]");
                    console.log("recipient: ".concat(to));
                    console.log("from: ".concat(fromAddress));
                    console.log("provider: Resend");
                    if (to.endsWith('@example.com')) {
                        console.log("[DELT EMAIL SIMULATION] Simulated delivery to ".concat(to));
                        return [2 /*return*/, {
                                success: true,
                                delivered: true,
                                simulated: true,
                                messageId: "sim-".concat(crypto.randomUUID())
                            }];
                    }
                    if (!hasEmailConfig()) {
                        msg = 'RESEND_API_KEY is missing or unconfigured in .env.local';
                        console.error("[DELT EMAIL ERROR] ".concat(msg));
                        return [2 /*return*/, {
                                success: false,
                                delivered: false,
                                simulated: false,
                                error: msg,
                            }];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch('https://api.resend.com/emails', {
                            method: 'POST',
                            headers: {
                                'Authorization': "Bearer ".concat(env.email.resendApiKey),
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                from: fromAddress,
                                to: [to],
                                subject: subject,
                                html: html,
                                text: text || undefined,
                            }),
                        })];
                case 2:
                    res = _a.sent();
                    return [4 /*yield*/, res.json()];
                case 3:
                    resJson = _a.sent();
                    if (!res.ok) {
                        console.error("[DELT EMAIL ERROR] Status ".concat(res.status, ":"), resJson);
                        return [2 /*return*/, {
                                success: false,
                                delivered: false,
                                error: (resJson === null || resJson === void 0 ? void 0 : resJson.message) || "Resend delivery failed (status ".concat(res.status, ")"),
                            }];
                    }
                    console.log("[DELT EMAIL SUCCESS] id: ".concat(resJson === null || resJson === void 0 ? void 0 : resJson.id));
                    return [2 /*return*/, {
                            success: true,
                            delivered: true,
                            messageId: resJson === null || resJson === void 0 ? void 0 : resJson.id,
                        }];
                case 4:
                    err_1 = _a.sent();
                    console.error('[DELT EMAIL NETWORK ERROR]', err_1);
                    return [2 /*return*/, {
                            success: false,
                            delivered: false,
                            error: (err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'Network error connecting to Resend API',
                        }];
                case 5: return [2 /*return*/];
            }
        });
    });
}
// ------------------------------------------------------------------------------
// 1. Unified 6-Digit OTP Verification Email (Creator Signup & Client Deal Access)
// ------------------------------------------------------------------------------
export function sendOtpEmail(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var to, otpCode, _a, expiresInMinutes, _b, subject, html, text;
        return __generator(this, function (_c) {
            to = payload.to, otpCode = payload.otpCode, _a = payload.expiresInMinutes, expiresInMinutes = _a === void 0 ? 10 : _a, _b = payload.subject, subject = _b === void 0 ? 'Your DELT verification code' : _b;
            html = "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>".concat(escapeHtml(subject), "</title>\n</head>\n<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;\">\n  <div style=\"max-width: 520px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);\">\n    \n    <!-- Header -->\n    <div style=\"background-color: #0f172a; padding: 24px 32px; text-align: left;\">\n      <span style=\"font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;\">DELT</span>\n    </div>\n\n    <!-- Body -->\n    <div style=\"padding: 32px;\">\n      <h2 style=\"font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px;\">\n        Your DELT verification code\n      </h2>\n      <p style=\"font-size: 15px; line-height: 1.5; color: #475569; margin-top: 0; margin-bottom: 20px;\">\n        Your DELT verification code is:\n      </p>\n\n      <!-- Code Box -->\n      <div style=\"background-color: #f1f5f9; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px; border: 1px solid #e2e8f0;\">\n        <span style=\"font-family: -apple-system, BlinkMacSystemFont, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;\">\n          ").concat(otpCode, "\n        </span>\n      </div>\n\n      <p style=\"font-size: 13px; line-height: 1.5; color: #64748b; margin-bottom: 20px;\">\n        This code expires in <strong>").concat(expiresInMinutes, " minutes</strong>.\n      </p>\n\n      <p style=\"font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 0;\">\n        If you did not request this code, you can ignore this email.\n      </p>\n    </div>\n\n    <!-- Footer -->\n    <div style=\"background-color: #f8fafc; padding: 14px 28px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;\">\n      DELT \u00B7 Private Transaction Platform\n    </div>\n\n  </div>\n</body>\n</html>\n");
            text = "Your DELT verification code is:\n\n".concat(otpCode, "\n\nThis code expires in ").concat(expiresInMinutes, " minutes.\n\nIf you did not request this code, you can ignore this email.\n\nDELT");
            return [2 /*return*/, sendRawEmail({
                    to: to,
                    subject: subject,
                    html: html,
                    text: text,
                })];
        });
    });
}
/**
 * Backward compatibility wrapper for client deal OTP emails.
 */
export function sendDealOtpEmail(payload) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, sendOtpEmail({
                    to: payload.clientEmail,
                    otpCode: payload.otpCode,
                    expiresInMinutes: payload.expiresInMinutes || 10,
                    subject: 'Your DELT verification code',
                })];
        });
    });
}
// ------------------------------------------------------------------------------
// 2. Client Deal Invitation Email
// ------------------------------------------------------------------------------
export function sendDealInvitationEmail(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var clientName, clientEmail, creatorName, dealTitle, dealDescription, dealPrice, dealCurrency, dealUrl, formattedAmount, html, text;
        return __generator(this, function (_a) {
            clientName = payload.clientName, clientEmail = payload.clientEmail, creatorName = payload.creatorName, dealTitle = payload.dealTitle, dealDescription = payload.dealDescription, dealPrice = payload.dealPrice, dealCurrency = payload.dealCurrency, dealUrl = payload.dealUrl;
            formattedAmount = "".concat(dealCurrency === 'INR' ? '₹' : dealCurrency + ' ').concat(dealPrice.toLocaleString('en-IN'));
            html = "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>New Deal from ".concat(escapeHtml(creatorName), "</title>\n</head>\n<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;\">\n  <div style=\"max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);\">\n    \n    <!-- Header -->\n    <div style=\"background-color: #0f172a; padding: 24px 32px; text-align: left;\">\n      <span style=\"font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;\">DELT</span>\n    </div>\n\n    <!-- Body -->\n    <div style=\"padding: 32px;\">\n      <h2 style=\"font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px;\">\n        You have a new Deal from ").concat(escapeHtml(creatorName), "\n      </h2>\n      <p style=\"font-size: 15px; line-height: 1.5; color: #475569; margin-top: 0; margin-bottom: 24px;\">\n        Hi ").concat(escapeHtml(clientName), ",<br><br>\n        <strong>").concat(escapeHtml(creatorName), "</strong> has created a private Deal workspace for you on DELT.\n      </p>\n\n      <!-- Deal Card -->\n      <div style=\"background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;\">\n        <div style=\"font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">\n          Project\n        </div>\n        <div style=\"font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px;\">\n          ").concat(escapeHtml(dealTitle), "\n        </div>\n        ").concat(dealDescription
                ? "<div style=\"font-size: 13px; color: #475569; margin-bottom: 14px; line-height: 1.4;\">\n                ".concat(escapeHtml(dealDescription), "\n              </div>")
                : '', "\n        <div style=\"font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;\">\n          Agreed Amount\n        </div>\n        <div style=\"font-size: 18px; font-weight: 700; color: #0f172a;\">\n          ").concat(formattedAmount, "\n        </div>\n      </div>\n\n      <p style=\"font-size: 14px; line-height: 1.5; color: #475569; margin-bottom: 28px;\">\n        Inside your private Deal workspace, you can review project details, communicate directly with the creator, negotiate pricing, make secure payment, and download verified deliverables.\n      </p>\n\n      <!-- CTA Button -->\n      <div style=\"text-align: center; margin-bottom: 24px;\">\n        <a href=\"").concat(dealUrl, "\" target=\"_blank\" style=\"display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);\">\n          Open Deal Workspace &rarr;\n        </a>\n      </div>\n\n      <!-- Plain Text Fallback Link -->\n      <p style=\"font-size: 12px; color: #64748b; word-break: break-all; margin-bottom: 28px;\">\n        Or copy and paste this link in your browser:<br>\n        <a href=\"").concat(dealUrl, "\" style=\"color: #2563eb; text-decoration: underline;\">").concat(dealUrl, "</a>\n      </p>\n\n      <p style=\"font-size: 12px; color: #94a3b8; line-height: 1.4; margin-bottom: 0;\">\n        If you were not expecting this invitation, you can safely ignore this email. This private Deal link is intended solely for ").concat(escapeHtml(clientEmail), ".\n      </p>\n    </div>\n\n    <!-- Footer -->\n    <div style=\"background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;\">\n      DELT \u00B7 Private Transaction Platform for Independent Creators\n    </div>\n\n  </div>\n</body>\n</html>\n");
            text = "Hi ".concat(clientName, ",\n\n").concat(creatorName, " has created a private Deal workspace for you on DELT for \"").concat(dealTitle, "\" (").concat(formattedAmount, ").\n\nOpen your deal here:\n").concat(dealUrl, "\n\nDELT");
            return [2 /*return*/, sendRawEmail({
                    to: clientEmail,
                    subject: "New Deal: \"".concat(dealTitle, "\" from ").concat(creatorName),
                    html: html,
                    text: text,
                })];
        });
    });
}
// ------------------------------------------------------------------------------
// 3. Payment Confirmation Email
// ------------------------------------------------------------------------------
export function sendPaymentConfirmationEmail(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var recipientName, recipientEmail, creatorName, dealTitle, amount, currency, transactionId, isCreator, dealUrl, formattedAmount, html;
        return __generator(this, function (_a) {
            recipientName = payload.recipientName, recipientEmail = payload.recipientEmail, creatorName = payload.creatorName, dealTitle = payload.dealTitle, amount = payload.amount, currency = payload.currency, transactionId = payload.transactionId, isCreator = payload.isCreator, dealUrl = payload.dealUrl;
            formattedAmount = "".concat(currency === 'INR' ? '₹' : currency + ' ').concat(amount.toLocaleString('en-IN'));
            html = "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Payment Confirmed \u2014 ".concat(escapeHtml(dealTitle), "</title>\n</head>\n<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;\">\n  <div style=\"max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);\">\n    \n    <div style=\"background-color: #0f172a; padding: 24px 32px; text-align: left;\">\n      <span style=\"font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;\">DELT</span>\n    </div>\n\n    <div style=\"padding: 32px;\">\n      <div style=\"display: inline-block; background-color: #ecfdf5; color: #059669; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;\">\n        Payment Successful\n      </div>\n      <h2 style=\"font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0; margin-bottom: 8px;\">\n        ").concat(isCreator ? "Payment Received from ".concat(escapeHtml(recipientName)) : "Payment Confirmed for ".concat(escapeHtml(dealTitle)), "\n      </h2>\n      <p style=\"font-size: 15px; line-height: 1.5; color: #475569; margin-top: 0; margin-bottom: 24px;\">\n        ").concat(isCreator
                ? "Great news! Your client has successfully completed the payment of <strong>".concat(formattedAmount, "</strong> for <strong>").concat(escapeHtml(dealTitle), "</strong>.")
                : "Thank you, ".concat(escapeHtml(recipientName), ". Your payment of <strong>").concat(formattedAmount, "</strong> to <strong>").concat(escapeHtml(creatorName), "</strong> has been verified. All project deliverable files are now unlocked."), "\n      </p>\n\n      <!-- Receipt Box -->\n      <div style=\"background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;\">\n        <div style=\"display: flex; justify-content: space-between; margin-bottom: 8px;\">\n          <span style=\"font-size: 13px; color: #64748b;\">Transaction ID:</span>\n          <span style=\"font-size: 13px; font-weight: 600; color: #0f172a; font-family: monospace;\">").concat(transactionId, "</span>\n        </div>\n        <div style=\"display: flex; justify-content: space-between; margin-bottom: 8px;\">\n          <span style=\"font-size: 13px; color: #64748b;\">Amount Paid:</span>\n          <span style=\"font-size: 13px; font-weight: 700; color: #0f172a;\">").concat(formattedAmount, "</span>\n        </div>\n        <div style=\"display: flex; justify-content: space-between;\">\n          <span style=\"font-size: 13px; color: #64748b;\">Status:</span>\n          <span style=\"font-size: 13px; font-weight: 600; color: #059669;\">Verified & Unlocked</span>\n        </div>\n      </div>\n\n      <div style=\"text-align: center; margin-bottom: 24px;\">\n        <a href=\"").concat(dealUrl, "\" target=\"_blank\" style=\"display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;\">\n          ").concat(isCreator ? 'View Deal Workspace &rarr;' : 'Download Deliverables &rarr;', "\n        </a>\n      </div>\n    </div>\n\n    <div style=\"background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;\">\n      DELT \u00B7 Private Transaction Platform\n    </div>\n\n  </div>\n</body>\n</html>\n");
            return [2 /*return*/, sendRawEmail({
                    to: recipientEmail,
                    subject: "Payment Confirmed: ".concat(formattedAmount, " for \"").concat(dealTitle, "\""),
                    html: html,
                })];
        });
    });
}
// ------------------------------------------------------------------------------
// 4. Deliverables Uploaded Notification Email
// ------------------------------------------------------------------------------
export function sendDeliverablesUploadedEmail(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var clientName, clientEmail, creatorName, dealTitle, versionNumber, _a, fileNames, dealUrl, html;
        return __generator(this, function (_b) {
            clientName = payload.clientName, clientEmail = payload.clientEmail, creatorName = payload.creatorName, dealTitle = payload.dealTitle, versionNumber = payload.versionNumber, _a = payload.fileNames, fileNames = _a === void 0 ? [] : _a, dealUrl = payload.dealUrl;
            html = "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>New Deliverables Uploaded</title>\n</head>\n<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;\">\n  <div style=\"max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;\">\n    \n    <div style=\"background-color: #0f172a; padding: 24px 32px;\">\n      <span style=\"font-size: 20px; font-weight: 700; color: #ffffff;\">DELT</span>\n    </div>\n\n    <div style=\"padding: 32px;\">\n      <h2 style=\"font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;\">\n        New Deliverables Uploaded (Version ".concat(versionNumber, ")\n      </h2>\n      <p style=\"font-size: 15px; line-height: 1.5; color: #475569;\">\n        Hi ").concat(escapeHtml(clientName), ",<br><br>\n        <strong>").concat(escapeHtml(creatorName), "</strong> has uploaded a new version of project files for <strong>").concat(escapeHtml(dealTitle), "</strong>.\n      </p>\n\n      ").concat(fileNames.length > 0
                ? "<div style=\"background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0;\">\n              <div style=\"font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; margin-bottom: 8px;\">Uploaded Files</div>\n              <ul style=\"margin: 0; padding-left: 20px; font-size: 13px; color: #0f172a;\">\n                ".concat(fileNames.map(function (f) { return "<li style=\"margin-bottom: 4px;\">".concat(escapeHtml(f), "</li>"); }).join(''), "\n              </ul>\n            </div>")
                : '', "\n\n      <div style=\"text-align: center; margin: 24px 0;\">\n        <a href=\"").concat(dealUrl, "\" target=\"_blank\" style=\"display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;\">\n          Review Deliverables &rarr;\n        </a>\n      </div>\n    </div>\n\n    <div style=\"background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;\">\n      DELT \u00B7 Private Transaction Platform\n    </div>\n\n  </div>\n</body>\n</html>\n");
            return [2 /*return*/, sendRawEmail({
                    to: clientEmail,
                    subject: "New Deliverables Uploaded (v".concat(versionNumber, ") for \"").concat(dealTitle, "\""),
                    html: html,
                })];
        });
    });
}
// ------------------------------------------------------------------------------
// 5. Deal Completion Email
// ------------------------------------------------------------------------------
export function sendDealCompletionEmail(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var recipientName, recipientEmail, creatorName, dealTitle, dealUrl, html;
        return __generator(this, function (_a) {
            recipientName = payload.recipientName, recipientEmail = payload.recipientEmail, creatorName = payload.creatorName, dealTitle = payload.dealTitle, dealUrl = payload.dealUrl;
            html = "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Deal Completed \u2014 ".concat(escapeHtml(dealTitle), "</title>\n</head>\n<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;\">\n  <div style=\"max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;\">\n    \n    <div style=\"background-color: #0f172a; padding: 24px 32px;\">\n      <span style=\"font-size: 20px; font-weight: 700; color: #ffffff;\">DELT</span>\n    </div>\n\n    <div style=\"padding: 32px;\">\n      <h2 style=\"font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;\">\n        \uD83C\uDF89 Deal Completed Successfully!\n      </h2>\n      <p style=\"font-size: 15px; line-height: 1.5; color: #475569;\">\n        Hi ").concat(escapeHtml(recipientName), ",<br><br>\n        The Deal workspace for <strong>").concat(escapeHtml(dealTitle), "</strong> with <strong>").concat(escapeHtml(creatorName), "</strong> has been marked completed! All deliverable approvals and payments have concluded.\n      </p>\n\n      <div style=\"text-align: center; margin: 28px 0;\">\n        <a href=\"").concat(dealUrl, "\" target=\"_blank\" style=\"display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;\">\n          Access Deal Archive &rarr;\n        </a>\n      </div>\n    </div>\n\n    <div style=\"background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;\">\n      DELT \u00B7 Private Transaction Platform\n    </div>\n\n  </div>\n</body>\n</html>\n");
            return [2 /*return*/, sendRawEmail({
                    to: recipientEmail,
                    subject: "Deal Completed: \"".concat(dealTitle, "\""),
                    html: html,
                })];
        });
    });
}
// ------------------------------------------------------------------------------
// 6. Proposal Status Email (Accepted / Declined)
// ------------------------------------------------------------------------------
export function sendProposalStatusEmail(payload) {
    return __awaiter(this, void 0, void 0, function () {
        var recipientName, recipientEmail, responderName, dealTitle, price, currency, accepted, dealUrl, formattedAmount, html;
        return __generator(this, function (_a) {
            recipientName = payload.recipientName, recipientEmail = payload.recipientEmail, responderName = payload.responderName, dealTitle = payload.dealTitle, price = payload.price, currency = payload.currency, accepted = payload.accepted, dealUrl = payload.dealUrl;
            formattedAmount = "".concat(currency === 'INR' ? '₹' : currency + ' ').concat(price.toLocaleString('en-IN'));
            html = "\n<!DOCTYPE html>\n<html>\n<head>\n  <meta charset=\"utf-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Price Proposal ".concat(accepted ? 'Accepted' : 'Declined', "</title>\n</head>\n<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 32px 16px; color: #0f172a;\">\n  <div style=\"max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden;\">\n    \n    <div style=\"background-color: #0f172a; padding: 24px 32px;\">\n      <span style=\"font-size: 20px; font-weight: 700; color: #ffffff;\">DELT</span>\n    </div>\n\n    <div style=\"padding: 32px;\">\n      <div style=\"display: inline-block; background-color: ").concat(accepted ? '#ecfdf5' : '#fef2f2', "; color: ").concat(accepted ? '#059669' : '#dc2626', "; font-size: 12px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; margin-bottom: 12px;\">\n        Proposal ").concat(accepted ? 'Accepted' : 'Declined', "\n      </div>\n      <h2 style=\"font-size: 20px; font-weight: 600; color: #0f172a; margin-top: 0;\">\n        ").concat(accepted ? "Price Agreement Reached: ".concat(formattedAmount) : "Price Proposal Declined", "\n      </h2>\n      <p style=\"font-size: 15px; line-height: 1.5; color: #475569;\">\n        Hi ").concat(escapeHtml(recipientName), ",<br><br>\n        <strong>").concat(escapeHtml(responderName), "</strong> has <strong>").concat(accepted ? 'accepted' : 'declined', "</strong> the price proposal of <strong>").concat(formattedAmount, "</strong> for <strong>").concat(escapeHtml(dealTitle), "</strong>.\n      </p>\n\n      <div style=\"text-align: center; margin: 28px 0;\">\n        <a href=\"").concat(dealUrl, "\" target=\"_blank\" style=\"display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;\">\n          View Deal Workspace &rarr;\n        </a>\n      </div>\n    </div>\n\n    <div style=\"background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;\">\n      DELT \u00B7 Private Transaction Platform\n    </div>\n\n  </div>\n</body>\n</html>\n");
            return [2 /*return*/, sendRawEmail({
                    to: recipientEmail,
                    subject: "Price Proposal ".concat(accepted ? 'Accepted' : 'Declined', ": ").concat(formattedAmount, " for \"").concat(dealTitle, "\""),
                    html: html,
                })];
        });
    });
}
function escapeHtml(str) {
    return (str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
