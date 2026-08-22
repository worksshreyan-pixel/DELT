"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_shell_1 = require("@/components/app-shell");
function AppLayout({ children }) {
    return <app_shell_1.AppShell>{children}</app_shell_1.AppShell>;
}
exports.default = AppLayout;
