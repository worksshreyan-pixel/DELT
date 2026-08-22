"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skeleton = void 0;
const utils_1 = require("@/lib/utils");
function Skeleton({ className, ...props }) {
    return (<div className={(0, utils_1.cn)('animate-pulse rounded-md bg-muted', className)} {...props}/>);
}
exports.Skeleton = Skeleton;
