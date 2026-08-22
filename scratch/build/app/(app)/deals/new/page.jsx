'use client';
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, FolderKanban, IndianRupee, FileCheck, Check, ArrowRight, ArrowLeft, Plus, X, CheckCircle2, Link as LinkIcon, Copy, Sparkles, Lock, ExternalLink, AlertCircle, Upload, Share2, Mail, RefreshCw, FileText, } from 'lucide-react';
import { Breadcrumb } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatCurrency, formatBytes } from '@/lib/plans';
import { STANDARD_TEMPLATES, createDealInStore, useAppStore } from '@/lib/app-store';
import { getDealPublicUrl } from '@/lib/deal-url';
var steps = [
    { id: 'client', label: 'Client', icon: User },
    { id: 'project', label: 'Project', icon: FolderKanban },
    { id: 'pricing', label: 'Pricing', icon: IndianRupee },
    { id: 'files', label: 'Deliverables & Files', icon: FileCheck },
    { id: 'review', label: 'Review', icon: Check },
];
export default function CreateDealPage() {
    return (<Suspense fallback={<div className="py-12 text-center text-sm text-muted-foreground">Loading deal creator...</div>}>
      <CreateDealForm />
    </Suspense>);
}
function CreateDealForm() {
    var router = useRouter();
    var searchParams = useSearchParams();
    var templateIdParam = searchParams.get('template');
    var store = useAppStore();
    var _a = useState(0), step = _a[0], setStep = _a[1];
    var _b = useState(null), createdDeal = _b[0], setCreatedDeal = _b[1];
    var _c = useState(null), emailStatus = _c[0], setEmailStatus = _c[1];
    var _d = useState(false), copied = _d[0], setCopied = _d[1];
    var _e = useState(false), resendingEmail = _e[0], setResendingEmail = _e[1];
    var _f = useState(null), resendResult = _f[0], setResendResult = _f[1];
    var _g = useState(templateIdParam || ''), selectedTemplateId = _g[0], setSelectedTemplateId = _g[1];
    var _h = useState(''), validationError = _h[0], setValidationError = _h[1];
    var _j = useState(false), loading = _j[0], setLoading = _j[1];
    var _k = useState(''), uploadProgress = _k[0], setUploadProgress = _k[1];
    var _l = useState({
        clientName: '',
        clientEmail: '',
        clientCompany: '',
        title: '',
        description: '',
        scope: [],
        deadline: '',
        price: '',
        currency: 'INR',
        deliverables: [],
    }), data = _l[0], setData = _l[1];
    var _m = useState([]), selectedFiles = _m[0], setSelectedFiles = _m[1];
    var _o = useState(false), previewEnabled = _o[0], setPreviewEnabled = _o[1];
    var _p = useState(''), scopeInput = _p[0], setScopeInput = _p[1];
    var _q = useState(''), deliverableInput = _q[0], setDeliverableInput = _q[1];
    var fileInputRef = useRef(null);
    // Prefill from template query param if provided
    useEffect(function () {
        if (templateIdParam) {
            var tpl_1 = STANDARD_TEMPLATES.find(function (t) { return t.id === templateIdParam; });
            if (tpl_1) {
                setData(function (prev) { return (__assign(__assign({}, prev), { title: tpl_1.name, description: tpl_1.description, scope: __spreadArray([], tpl_1.scope, true), price: tpl_1.defaultPrice.toString(), currency: tpl_1.currency, deliverables: __spreadArray([], tpl_1.deliverables, true) })); });
                setSelectedTemplateId(tpl_1.id);
            }
        }
    }, [templateIdParam]);
    function applyTemplate(tplId) {
        var tpl = STANDARD_TEMPLATES.find(function (t) { return t.id === tplId; });
        if (!tpl)
            return;
        setData(function (prev) { return (__assign(__assign({}, prev), { title: tpl.name, description: tpl.description, scope: __spreadArray([], tpl.scope, true), price: tpl.defaultPrice.toString(), currency: tpl.currency, deliverables: __spreadArray([], tpl.deliverables, true) })); });
        setSelectedTemplateId(tpl.id);
    }
    function applyClient(clientId) {
        var cl = store.clients.find(function (c) { return c.id === clientId; });
        if (!cl)
            return;
        setData(function (prev) { return (__assign(__assign({}, prev), { clientName: cl.name, clientEmail: cl.email, clientCompany: cl.company || '' })); });
    }
    function update(field, value) {
        setData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), (_a = {}, _a[field] = value, _a)));
        });
        setValidationError('');
    }
    function addScope() {
        if (scopeInput.trim()) {
            update('scope', __spreadArray(__spreadArray([], data.scope, true), [scopeInput.trim()], false));
            setScopeInput('');
        }
    }
    function removeScope(idx) {
        update('scope', data.scope.filter(function (_, i) { return i !== idx; }));
    }
    function addDeliverable() {
        if (deliverableInput.trim()) {
            update('deliverables', __spreadArray(__spreadArray([], data.deliverables, true), [deliverableInput.trim()], false));
            setDeliverableInput('');
        }
    }
    function removeDeliverable(idx) {
        update('deliverables', data.deliverables.filter(function (_, i) { return i !== idx; }));
    }
    function handleFileSelect(e) {
        if (e.target.files) {
            var files_1 = Array.from(e.target.files);
            setSelectedFiles(function (prev) { return __spreadArray(__spreadArray([], prev, true), files_1, true); });
        }
    }
    function removeFile(idx) {
        setSelectedFiles(function (prev) { return prev.filter(function (_, i) { return i !== idx; }); });
    }
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    function canProceed() {
        switch (step) {
            case 0:
                return data.clientName.trim().length > 0 && isValidEmail(data.clientEmail.trim());
            case 1:
                return data.title.trim().length > 0;
            case 2:
                return Number(data.price) > 0;
            default:
                return true;
        }
    }
    function handleCreate() {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var priceNum, res, errJson, json, deal, deliverableId, uploadedFileItems, i, file, signRes, signErr, _c, signedUrl, filePath, putRes, previewPath, previewType, previewStatus, previewGeneratedAt, ext, isVideo, previewBlob, originalExt, previewExt, originalBaseName, previewName, signPrevRes, _d, prevSignedUrl, prevFilePath, putPrevRes, err_1, hasVideo, registerRes, regErr, err_2;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!data.clientName.trim() || !isValidEmail(data.clientEmail.trim())) {
                            setValidationError('Please enter a valid client name and email address.');
                            setStep(0);
                            return [2 /*return*/];
                        }
                        if (!data.title.trim()) {
                            setValidationError('Please enter a project title.');
                            setStep(1);
                            return [2 /*return*/];
                        }
                        priceNum = Number(data.price);
                        if (!priceNum || priceNum <= 0) {
                            setValidationError('Please enter a valid positive deal price.');
                            setStep(2);
                            return [2 /*return*/];
                        }
                        setLoading(true);
                        setValidationError('');
                        setUploadProgress('Creating deal...');
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 28, 29, 30]);
                        return [4 /*yield*/, fetch('/api/deals/create', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    clientName: data.clientName.trim(),
                                    clientEmail: data.clientEmail.trim(),
                                    clientCompany: data.clientCompany.trim(),
                                    title: data.title.trim(),
                                    description: data.description.trim(),
                                    price: priceNum,
                                    currency: data.currency,
                                    deadline: data.deadline,
                                    scope: data.scope,
                                    deliverables: data.deliverables,
                                    previewEnabled: previewEnabled
                                }),
                            })];
                    case 2:
                        res = _e.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.json()];
                    case 3:
                        errJson = _e.sent();
                        throw new Error(errJson.error || 'Failed to create deal');
                    case 4: return [4 /*yield*/, res.json()];
                    case 5:
                        json = _e.sent();
                        if (!json.success || !json.deal) {
                            throw new Error('Deal creation returned unsuccessful response');
                        }
                        deal = json.deal;
                        deliverableId = json.deliverableId;
                        uploadedFileItems = [];
                        if (!(selectedFiles.length > 0 && deliverableId)) return [3 /*break*/, 27];
                        i = 0;
                        _e.label = 6;
                    case 6:
                        if (!(i < selectedFiles.length)) return [3 /*break*/, 22];
                        file = selectedFiles[i];
                        setUploadProgress("Uploading ".concat(i + 1, "/").concat(selectedFiles.length, "..."));
                        return [4 /*yield*/, fetch('/api/files/signed-url', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    dealId: deal.id,
                                    fileName: file.name,
                                    isUpload: true,
                                    version: 1
                                })
                            })];
                    case 7:
                        signRes = _e.sent();
                        if (!!signRes.ok) return [3 /*break*/, 9];
                        return [4 /*yield*/, signRes.json()];
                    case 8:
                        signErr = _e.sent();
                        throw new Error("Failed to get upload authorization for ".concat(file.name, ": ").concat(signErr.error || 'unknown error'));
                    case 9: return [4 /*yield*/, signRes.json()];
                    case 10:
                        _c = _e.sent(), signedUrl = _c.signedUrl, filePath = _c.filePath;
                        return [4 /*yield*/, fetch(signedUrl, {
                                method: 'PUT',
                                body: file,
                                headers: {
                                    'Content-Type': file.type || 'application/octet-stream',
                                }
                            })];
                    case 11:
                        putRes = _e.sent();
                        if (!putRes.ok) {
                            throw new Error("Failed to upload ".concat(file.name, " directly to storage"));
                        }
                        previewPath = undefined;
                        previewType = undefined;
                        previewStatus = undefined;
                        previewGeneratedAt = undefined;
                        ext = ((_a = file.name.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                        isVideo = (file.type || '').startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext);
                        if (!(previewEnabled && isVideo)) return [3 /*break*/, 12];
                        previewStatus = 'processing';
                        previewType = 'video/mp4';
                        return [3 /*break*/, 20];
                    case 12:
                        if (!previewEnabled) return [3 /*break*/, 20];
                        _e.label = 13;
                    case 13:
                        _e.trys.push([13, 19, , 20]);
                        return [4 /*yield*/, generateClientPreview(file)];
                    case 14:
                        previewBlob = _e.sent();
                        if (!previewBlob) return [3 /*break*/, 18];
                        originalExt = (_b = file.name.split('.').pop()) === null || _b === void 0 ? void 0 : _b.toLowerCase();
                        previewExt = originalExt || 'jpg';
                        if (previewBlob.type === 'image/jpeg' && originalExt !== 'jpg' && originalExt !== 'jpeg') {
                            previewExt = 'jpg';
                        }
                        originalBaseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
                        previewName = "preview-".concat(originalBaseName, ".").concat(previewExt);
                        return [4 /*yield*/, fetch('/api/files/signed-url', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    dealId: deal.id,
                                    fileName: previewName,
                                    isUpload: true,
                                    isPreview: true,
                                    version: 1
                                })
                            })];
                    case 15:
                        signPrevRes = _e.sent();
                        if (!signPrevRes.ok) return [3 /*break*/, 18];
                        return [4 /*yield*/, signPrevRes.json()];
                    case 16:
                        _d = _e.sent(), prevSignedUrl = _d.signedUrl, prevFilePath = _d.filePath;
                        return [4 /*yield*/, fetch(prevSignedUrl, {
                                method: 'PUT',
                                body: previewBlob,
                                headers: {
                                    'Content-Type': previewBlob.type,
                                }
                            })];
                    case 17:
                        putPrevRes = _e.sent();
                        if (putPrevRes.ok) {
                            previewPath = prevFilePath;
                            previewType = previewBlob.type;
                            previewStatus = 'ready';
                            previewGeneratedAt = new Date().toISOString();
                        }
                        else {
                            console.error('Failed to PUT upload preview blob for:', file.name);
                        }
                        _e.label = 18;
                    case 18: return [3 /*break*/, 20];
                    case 19:
                        err_1 = _e.sent();
                        console.error('Error generating/uploading preview client-side:', err_1);
                        return [3 /*break*/, 20];
                    case 20:
                        uploadedFileItems.push({
                            id: "f_".concat(Date.now(), "_").concat(Math.random().toString(36).slice(2, 7)),
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            path: filePath,
                            previewPath: previewPath,
                            previewType: previewType,
                            previewStatus: previewStatus,
                            previewGeneratedAt: previewGeneratedAt
                        });
                        _e.label = 21;
                    case 21:
                        i++;
                        return [3 /*break*/, 6];
                    case 22:
                        hasVideo = uploadedFileItems.some(function (f) { return f.previewStatus === 'processing'; });
                        if (hasVideo) {
                            setUploadProgress('Processing video preview...');
                        }
                        else {
                            setUploadProgress('Finalizing...');
                        }
                        return [4 /*yield*/, fetch('/api/files/upload', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    dealId: deal.id,
                                    deliverableId: deliverableId,
                                    files: uploadedFileItems
                                })
                            })];
                    case 23:
                        registerRes = _e.sent();
                        if (!!registerRes.ok) return [3 /*break*/, 25];
                        return [4 /*yield*/, registerRes.json()];
                    case 24:
                        regErr = _e.sent();
                        throw new Error("Failed to register uploaded files: ".concat(regErr.error || 'unknown error'));
                    case 25:
                        if (!hasVideo) return [3 /*break*/, 27];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 5000); })];
                    case 26:
                        _e.sent();
                        _e.label = 27;
                    case 27:
                        // Sync local reactive store
                        createDealInStore({
                            clientName: data.clientName.trim(),
                            clientEmail: data.clientEmail.trim(),
                            clientCompany: data.clientCompany.trim() || undefined,
                            title: data.title.trim(),
                            description: data.description.trim(),
                            scope: data.scope,
                            price: priceNum,
                            currency: data.currency,
                            deadline: data.deadline,
                            deliverables: data.deliverables,
                        });
                        setCreatedDeal(deal);
                        setEmailStatus(json.emailResult || null);
                        return [3 /*break*/, 30];
                    case 28:
                        err_2 = _e.sent();
                        console.error('Error creating deal:', err_2);
                        setValidationError(err_2.message || 'Deal creation failed.');
                        return [3 /*break*/, 30];
                    case 29:
                        setLoading(false);
                        setUploadProgress('');
                        return [7 /*endfinally*/];
                    case 30: return [2 /*return*/];
                }
            });
        });
    }
    function handleShare(url, title) {
        return __awaiter(this, void 0, void 0, function () {
            var err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof navigator !== 'undefined' && navigator.share)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, navigator.share({
                                title: "DELT Deal: ".concat(title),
                                text: "Here is your private Deal workspace on DELT: ".concat(title),
                                url: url,
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                    case 3:
                        err_3 = _a.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        navigator.clipboard.writeText(url);
                        setCopied(true);
                        setTimeout(function () { return setCopied(false); }, 2000);
                        return [2 /*return*/];
                }
            });
        });
    }
    function handleResendEmail(token) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function () {
            var res, json, err_4;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        setResendingEmail(true);
                        setResendResult(null);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, fetch("/api/deals/".concat(encodeURIComponent(token), "/resend-invite"), {
                                method: 'POST',
                            })];
                    case 2:
                        res = _d.sent();
                        return [4 /*yield*/, res.json()];
                    case 3:
                        json = _d.sent();
                        if (res.ok && ((_a = json.emailResult) === null || _a === void 0 ? void 0 : _a.delivered)) {
                            setResendResult('Invitation email resent successfully!');
                        }
                        else if ((_b = json.emailResult) === null || _b === void 0 ? void 0 : _b.simulated) {
                            setResendResult('Email simulated (Resend API key not configured in .env.local).');
                        }
                        else {
                            setResendResult(((_c = json.emailResult) === null || _c === void 0 ? void 0 : _c.error) || 'Email delivery requires RESEND_API_KEY configuration.');
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        err_4 = _d.sent();
                        setResendResult('Failed to resend invitation email.');
                        return [3 /*break*/, 6];
                    case 5:
                        setResendingEmail(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    if (createdDeal) {
        var canonicalUrl_1 = getDealPublicUrl(createdDeal.token);
        return (<div className="mx-auto max-w-lg py-6">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="border-border">
            <CardContent className="p-6 sm:p-8 space-y-6">
              {/* Header Badge */}
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                  <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400"/>
                </div>
                <h2 className="text-xl font-display font-semibold tracking-tight">Deal created successfully</h2>
                <p className="text-sm font-medium text-foreground">
                  {createdDeal.title} · {formatCurrency(createdDeal.price, createdDeal.currency)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Client: <strong className="text-foreground">{data.clientName}</strong> ({data.clientEmail})
                </p>
              </div>

              {/* Email Status Indicator */}
              <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0"/>
                  <span>
                    Client invitation:{' '}
                    {emailStatus === null ? (<strong className="text-amber-600 dark:text-amber-400 font-medium">Ready to send</strong>) : (emailStatus === null || emailStatus === void 0 ? void 0 : emailStatus.delivered) ? (<strong className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Sent to {data.clientEmail}</strong>) : (emailStatus === null || emailStatus === void 0 ? void 0 : emailStatus.simulated) ? (<strong className="text-muted-foreground font-medium">Simulated (Dev mode)</strong>) : (<strong className="text-amber-600 dark:text-amber-400 font-medium">⚠ Failed to send — use Copy Link / Resend Invitation</strong>)}
                  </span>
                </div>
                <Button variant="ghost" size="sm" onClick={function () { return handleResendEmail(createdDeal.token); }} disabled={resendingEmail} className="h-7 px-2 text-xs gap-1">
                  <RefreshCw className={cn("h-3 w-3", resendingEmail && "animate-spin")}/>
                  {resendingEmail ? 'Sending...' : 'Resend Email'}
                </Button>
              </div>

              {resendResult && (<p className="text-[11px] text-muted-foreground text-center">{resendResult}</p>)}

              {/* Private Link Box */}
              <div className="space-y-2 text-left">
                <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5"/>
                  Your private Deal link
                </Label>
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2.5">
                  <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0"/>
                  <span className="flex-1 truncate text-xs font-mono select-all">{canonicalUrl_1}</span>
                  <Button variant="ghost" size="sm" className="gap-1.5 shrink-0" onClick={function () {
                navigator.clipboard.writeText(canonicalUrl_1);
                setCopied(true);
                setTimeout(function () { return setCopied(false); }, 2000);
            }}>
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-500"/> : <Copy className="h-3.5 w-3.5"/>}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                  Only authorized people with this private link and email verification can open this workspace.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button variant="outline" className="gap-1.5 text-xs" onClick={function () {
                navigator.clipboard.writeText(canonicalUrl_1);
                setCopied(true);
                setTimeout(function () { return setCopied(false); }, 2000);
            }}>
                    <Copy className="h-3.5 w-3.5"/>
                    {copied ? 'Link Copied!' : 'Copy Link'}
                  </Button>
                  <Button variant="outline" className="gap-1.5 text-xs" onClick={function () { return handleShare(canonicalUrl_1, createdDeal.title); }}>
                    <Share2 className="h-3.5 w-3.5"/>
                    Share
                  </Button>
                  <Button variant="outline" className="gap-1.5 text-xs" onClick={function () { return window.open(canonicalUrl_1, '_blank'); }}>
                    <ExternalLink className="h-3.5 w-3.5"/>
                    Open Client View
                  </Button>
                </div>

                <div className="pt-2">
                  <Button className="w-full gap-2" onClick={function () { return router.push("/deals/".concat(createdDeal.id)); }}>
                    Open Deal Workspace
                    <ArrowRight className="h-4 w-4"/>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>);
    }
    return (<div className="space-y-6 max-w-3xl mx-auto">
      <Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: 'New Deal' }]}/>

      {/* Step indicator */}
      <div className="pb-2">
        <div className="flex items-center justify-between">
          {steps.map(function (s, i) { return (<div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors', i < step
                ? 'border-primary bg-primary text-primary-foreground'
                : i === step
                    ? 'border-primary bg-background text-primary'
                    : 'border-border bg-background text-muted-foreground')}>
                  {i < step ? <Check className="h-4 w-4"/> : <s.icon className="h-4 w-4"/>}
                </div>
                <span className={cn('text-xs font-medium', i <= step ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (<div className={cn('mx-2 h-0.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-border')}/>)}
            </div>); })}
        </div>
      </div>

      <Card>
        <CardContent className="p-6 sm:p-8">
          {validationError && (<div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0"/>
              <span>{validationError}</span>
            </div>)}

          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }}>
              {/* Step 1: Client */}
              {step === 0 && (<div className="space-y-5 max-w-md">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Client details</h2>
                    <p className="text-sm text-muted-foreground">Who is this deal for?</p>
                  </div>

                  {store.clients.length > 0 && (<div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                      <Label className="text-xs text-muted-foreground">Select an existing client (optional)</Label>
                      <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 text-xs" onChange={function (e) {
                    if (e.target.value)
                        applyClient(e.target.value);
                }} defaultValue="">
                        <option value="">-- Choose from your clients --</option>
                        {store.clients.map(function (c) { return (<option key={c.id} value={c.id}>
                            {c.name} ({c.company || c.email})
                          </option>); })}
                      </select>
                    </div>)}

                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client name *</Label>
                    <Input id="clientName" placeholder="e.g. Rahul Sharma" value={data.clientName} onChange={function (e) { return update('clientName', e.target.value); }} required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client email *</Label>
                    <Input id="clientEmail" type="email" placeholder="e.g. rahul@example.com" value={data.clientEmail} onChange={function (e) { return update('clientEmail', e.target.value); }} required/>
                    <p className="text-xs text-muted-foreground">
                      An invitation with the private Deal link will be sent to this email address.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientCompany">Company name (optional)</Label>
                    <Input id="clientCompany" placeholder="e.g. TechCorp" value={data.clientCompany} onChange={function (e) { return update('clientCompany', e.target.value); }}/>
                  </div>
                </div>)}

              {/* Step 2: Project */}
              {step === 1 && (<div className="space-y-5 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Project details</h2>
                    <p className="text-sm text-muted-foreground">Describe the project and scope of work.</p>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary"/>
                      Optional: Load from template
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {STANDARD_TEMPLATES.map(function (t) { return (<button key={t.id} type="button" onClick={function () { return applyTemplate(t.id); }} className={cn('rounded-md px-2.5 py-1 text-xs font-medium border transition-colors', selectedTemplateId === t.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground')}>
                          {t.name}
                        </button>); })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="title">Project title *</Label>
                    <Input id="title" placeholder="e.g. Final YouTube Video" value={data.title} onChange={function (e) { return update('title', e.target.value); }} required/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea id="description" placeholder="Brief overview of project goals..." rows={3} value={data.description} onChange={function (e) { return update('description', e.target.value); }}/>
                  </div>
                  <div className="space-y-2">
                    <Label>Scope items (optional)</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Add a scope milestone or task..." value={scopeInput} onChange={function (e) { return setScopeInput(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') {
            e.preventDefault();
            addScope();
        } }}/>
                      <Button variant="outline" size="icon" onClick={addScope}>
                        <Plus className="h-4 w-4"/>
                      </Button>
                    </div>
                    {data.scope.length > 0 && (<div className="space-y-1.5 mt-2">
                        {data.scope.map(function (s, i) { return (<div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                            <span className="text-sm">{s}</span>
                            <button onClick={function () { return removeScope(i); }} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5"/>
                            </button>
                          </div>); })}
                      </div>)}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Target deadline (optional)</Label>
                    <Input id="deadline" type="date" value={data.deadline} onChange={function (e) { return update('deadline', e.target.value); }}/>
                  </div>
                </div>)}

              {/* Step 3: Pricing */}
              {step === 2 && (<div className="space-y-5 max-w-md">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Pricing</h2>
                    <p className="text-sm text-muted-foreground">Set the project price and currency.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="price">Price *</Label>
                      <Input id="price" type="number" placeholder="2500" value={data.price} onChange={function (e) { return update('price', e.target.value); }} required/>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select id="currency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={data.currency} onChange={function (e) { return update('currency', e.target.value); }}>
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>
                  {Number(data.price) > 0 && (<div className="rounded-lg bg-muted/40 p-4 border border-border">
                      <p className="text-xs text-muted-foreground">Total Project Amount</p>
                      <p className="text-2xl font-display font-semibold mt-1">
                        {formatCurrency(Number(data.price), data.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Client can review, accept, or propose price adjustments inside the Deal chat.
                      </p>
                    </div>)}
                </div>)}

              {/* Step 4: Deliverables & File Upload */}
              {step === 3 && (<div className="space-y-6 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Deliverables & Files (optional)</h2>
                    <p className="text-sm text-muted-foreground">Upload deliverable files or list project milestones.</p>
                  </div>

                  {/* Client File Preview Settings */}
                  <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium">Client File Preview</span>
                        <p className="text-xs text-muted-foreground pr-4">
                          Allow the client to preview supported deliverables before payment.
                        </p>
                      </div>
                      <button type="button" onClick={function () { return setPreviewEnabled(!previewEnabled); }} className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2", previewEnabled ? "bg-primary" : "bg-muted")}>
                        <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out", previewEnabled ? "translate-x-5" : "translate-x-0")}/>
                      </button>
                    </div>
                  </div>

                  {/* File Upload Box */}
                  <div className="space-y-3">
                    <Label className="text-xs font-medium">Attach Deliverable Files</Label>
                    <div onClick={function () { var _a; return (_a = fileInputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }} className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect}/>
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
                        <Upload className="h-5 w-5"/>
                      </div>
                      <p className="text-sm font-medium">Click to browse or drag and drop files</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ZIP, PDF, MP4, PNG, JPG, PSD, Figma archives (up to 100MB)
                      </p>
                    </div>

                    {/* Selected files list */}
                    {selectedFiles.length > 0 && (<div className="space-y-2 pt-1">
                        <p className="text-xs font-medium text-muted-foreground">{selectedFiles.length} file(s) selected:</p>
                        {selectedFiles.map(function (file, idx) { return (<div key={idx} className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5 text-xs border border-border">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <FileText className="h-4 w-4 text-primary shrink-0"/>
                              <span className="truncate font-medium">{file.name}</span>
                              <span className="text-muted-foreground shrink-0">({formatBytes(file.size)})</span>
                            </div>
                            <button type="button" onClick={function () { return removeFile(idx); }} className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors">
                              <X className="h-3.5 w-3.5"/>
                            </button>
                          </div>); })}
                      </div>)}
                  </div>

                  {/* Deliverable Milestones */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <Label className="text-xs font-medium">Deliverable Item Names (optional)</Label>
                    <div className="flex gap-2">
                      <Input placeholder="e.g. Master Video Export (4K)..." value={deliverableInput} onChange={function (e) { return setDeliverableInput(e.target.value); }} onKeyDown={function (e) { if (e.key === 'Enter') {
            e.preventDefault();
            addDeliverable();
        } }}/>
                      <Button variant="outline" size="icon" onClick={addDeliverable}>
                        <Plus className="h-4 w-4"/>
                      </Button>
                    </div>
                    {data.deliverables.length > 0 && (<div className="space-y-1.5 mt-2">
                        {data.deliverables.map(function (d, i) { return (<div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                            <span className="text-sm">{d}</span>
                            <button onClick={function () { return removeDeliverable(i); }} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5"/>
                            </button>
                          </div>); })}
                      </div>)}
                  </div>
                </div>)}

              {/* Step 5: Review */}
              {step === 4 && (<div className="space-y-5 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Review & Create</h2>
                    <p className="text-sm text-muted-foreground">Confirm details before generating your private deal link.</p>
                  </div>
                  <div className="space-y-3 rounded-lg border border-border p-4 bg-muted/20">
                    <ReviewRow label="Client" value={"".concat(data.clientName, " (").concat(data.clientEmail, ")")}/>
                    <ReviewRow label="Project" value={data.title}/>
                    <ReviewRow label="Description" value={data.description || '—'}/>
                    <ReviewRow label="Scope" value={data.scope.length > 0 ? data.scope.join(', ') : 'Standard Project Scope'}/>
                    <ReviewRow label="Deadline" value={data.deadline ? new Date(data.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Flexible'}/>
                    <ReviewRow label="Price" value={data.price ? formatCurrency(Number(data.price), data.currency) : '—'}/>
                    <ReviewRow label="Deliverable Files" value={selectedFiles.length > 0 ? "".concat(selectedFiles.length, " file(s) attached") : 'Upload anytime in workspace'}/>
                  </div>
                </div>)}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
            <Button variant="ghost" onClick={function () { return (step > 0 ? setStep(step - 1) : router.push('/deals')); }} className="gap-1.5" disabled={loading}>
              <ArrowLeft className="h-4 w-4"/>
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < 4 ? (<Button onClick={function () { return setStep(step + 1); }} disabled={!canProceed()} className="gap-1.5">
                Continue
                <ArrowRight className="h-4 w-4"/>
              </Button>) : (<Button onClick={handleCreate} disabled={loading} className="gap-1.5">
                <Check className="h-4 w-4"/>
                {loading ? (uploadProgress || 'Creating Deal & Uploading...') : 'Create Deal'}
              </Button>)}
          </div>
        </CardContent>
      </Card>
    </div>);
}
function ReviewRow(_a) {
    var label = _a.label, value = _a.value;
    return (<div className="flex flex-col gap-0.5 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>);
}
var loadPdfLib = function () {
    return new Promise(function (resolve, reject) {
        if (window.PDFLib)
            return resolve(window.PDFLib);
        var script = document.createElement('script');
        script.src = '/lib/pdf-lib.min.js';
        script.onload = function () { return resolve(window.PDFLib); };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};
function generateClientPreview(file) {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var fileType, ext, isImage, isPdf, PDFLib, fileBytes, _b, pdfDoc, font, pages, pagesToKeep, previewDoc, copiedPages, _i, copiedPages_1, page, _c, width, height, text, fontSize, stepX, stepY, rotationAngle, y, xOffset, x, previewBytes, err_5;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    fileType = file.type || '';
                    ext = ((_a = file.name.split('.').pop()) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
                    isImage = fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
                    isPdf = fileType === 'application/pdf' || ext === 'pdf';
                    if (isImage) {
                        return [2 /*return*/, new Promise(function (resolve) {
                                var reader = new FileReader();
                                reader.onload = function (event) {
                                    var _a;
                                    var img = new Image();
                                    img.onload = function () {
                                        var canvas = document.createElement('canvas');
                                        var maxDim = 1000;
                                        var width = img.width;
                                        var height = img.height;
                                        if (width > height) {
                                            if (width > maxDim) {
                                                height = Math.round((height * maxDim) / width);
                                                width = maxDim;
                                            }
                                        }
                                        else {
                                            if (height > maxDim) {
                                                width = Math.round((width * maxDim) / height);
                                                height = maxDim;
                                            }
                                        }
                                        canvas.width = width;
                                        canvas.height = height;
                                        var ctx = canvas.getContext('2d');
                                        if (!ctx) {
                                            resolve(null);
                                            return;
                                        }
                                        ctx.drawImage(img, 0, 0, width, height);
                                        ctx.save();
                                        // Calculate font size dynamically based on dimensions (responsive)
                                        var fontSize = Math.max(32, Math.round(Math.min(width, height) * 0.045));
                                        ctx.strokeStyle = 'rgba(70, 70, 70, 0.35)'; // Hollow dark gray outline at 35% opacity
                                        ctx.lineWidth = 2;
                                        ctx.font = "bold ".concat(fontSize, "px sans-serif");
                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'middle';
                                        var text = 'DELT PREVIEW';
                                        var textWidth = ctx.measureText(text).width;
                                        var stepX = textWidth + 35; // Compact horizontal gap (20-50px)
                                        var stepY = fontSize + 45; // Compact vertical gap (30-60px)
                                        // Rotate by -30 degrees
                                        ctx.rotate((-30 * Math.PI) / 180);
                                        // Render staggered tiled grid of hollow watermarks
                                        for (var y = -height * 2; y < height * 2.5; y += stepY) {
                                            var xOffset = (Math.round(y / stepY) % 2 === 0) ? 0 : stepX / 2;
                                            for (var x = -width * 2 - xOffset; x < width * 2.5; x += stepX) {
                                                ctx.strokeText(text, x + xOffset, y);
                                            }
                                        }
                                        ctx.restore();
                                        canvas.toBlob(function (blob) {
                                            resolve(blob);
                                        }, 'image/jpeg', 0.6);
                                    };
                                    img.onerror = function () { return resolve(null); };
                                    img.src = (_a = event.target) === null || _a === void 0 ? void 0 : _a.result;
                                };
                                reader.onerror = function () { return resolve(null); };
                                reader.readAsDataURL(file);
                            })];
                    }
                    if (!isPdf) return [3 /*break*/, 10];
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 9, , 10]);
                    return [4 /*yield*/, loadPdfLib()];
                case 2:
                    PDFLib = (_d.sent());
                    if (!PDFLib)
                        return [2 /*return*/, null];
                    _b = Uint8Array.bind;
                    return [4 /*yield*/, file.arrayBuffer()];
                case 3:
                    fileBytes = new (_b.apply(Uint8Array, [void 0, _d.sent()]))();
                    return [4 /*yield*/, PDFLib.PDFDocument.load(fileBytes)];
                case 4:
                    pdfDoc = _d.sent();
                    return [4 /*yield*/, pdfDoc.embedFont(PDFLib.StandardFonts.HelveticaBold)];
                case 5:
                    font = _d.sent();
                    pages = pdfDoc.getPages();
                    pagesToKeep = pages.slice(0, 5);
                    return [4 /*yield*/, PDFLib.PDFDocument.create()];
                case 6:
                    previewDoc = _d.sent();
                    return [4 /*yield*/, previewDoc.copyPages(pdfDoc, pagesToKeep.map(function (_, i) { return i; }))];
                case 7:
                    copiedPages = _d.sent();
                    for (_i = 0, copiedPages_1 = copiedPages; _i < copiedPages_1.length; _i++) {
                        page = copiedPages_1[_i];
                        previewDoc.addPage(page);
                        _c = page.getSize(), width = _c.width, height = _c.height;
                        text = 'DELT PREVIEW';
                        fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.045));
                        stepX = (fontSize * 8) + 35;
                        stepY = fontSize + 45;
                        rotationAngle = 30;
                        page.pushOperators(PDFLib.pushGraphicsState(), PDFLib.setStrokingColor(PDFLib.rgb(0.27, 0.27, 0.27)), // rgb(70,70,70) -> 70/255 = 0.27
                        PDFLib.setLineWidth(2), PDFLib.setTextRenderingMode(PDFLib.TextRenderingMode.Outline));
                        for (y = -100; y < height + 200; y += stepY) {
                            xOffset = (Math.round(y / stepY) % 2 === 0) ? 0 : stepX / 2;
                            for (x = -100 - xOffset; x < width + 200; x += stepX) {
                                page.drawText(text, {
                                    x: x + xOffset,
                                    y: y,
                                    size: fontSize,
                                    font: font,
                                    opacity: 0.35,
                                    rotate: PDFLib.degrees(rotationAngle),
                                });
                            }
                        }
                        page.pushOperators(PDFLib.popGraphicsState());
                    }
                    return [4 /*yield*/, previewDoc.save()];
                case 8:
                    previewBytes = _d.sent();
                    return [2 /*return*/, new Blob([previewBytes], { type: 'application/pdf' })];
                case 9:
                    err_5 = _d.sent();
                    console.error('Error generating PDF preview client-side:', err_5);
                    return [2 /*return*/, null];
                case 10: return [2 /*return*/, null];
            }
        });
    });
}
