"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const link_1 = __importDefault(require("next/link"));
const framer_motion_1 = require("framer-motion");
const lucide_react_1 = require("lucide-react");
const app_shell_1 = require("@/components/app-shell");
const card_1 = require("@/components/ui/card");
const button_1 = require("@/components/ui/button");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const textarea_1 = require("@/components/ui/textarea");
const dialog_1 = require("@/components/ui/dialog");
const empty_state_1 = require("@/components/empty-state");
const app_store_1 = require("@/lib/app-store");
const plans_1 = require("@/lib/plans");
function TemplatesPage() {
    const [templates, setTemplates] = (0, react_1.useState)(app_store_1.STANDARD_TEMPLATES);
    const [dialogMode, setDialogMode] = (0, react_1.useState)(null);
    const [activeTemplate, setActiveTemplate] = (0, react_1.useState)(null);
    // Form state
    const [formData, setFormData] = (0, react_1.useState)({
        name: '',
        category: 'Web Development',
        description: '',
        defaultPrice: '',
        scopeText: '',
        deliverablesText: '',
    });
    function openCreate() {
        setFormData({
            name: '',
            category: 'Web Development',
            description: '',
            defaultPrice: '40000',
            scopeText: 'Initial consultation\nCustom design & prototype\nResponsive implementation\nFinal handoff',
            deliverablesText: 'Source files\nDeployment & documentation',
        });
        setActiveTemplate(null);
        setDialogMode('create');
    }
    function openEdit(tpl) {
        setActiveTemplate(tpl);
        setFormData({
            name: tpl.name,
            category: tpl.category,
            description: tpl.description,
            defaultPrice: tpl.defaultPrice.toString(),
            scopeText: tpl.scope.join('\n'),
            deliverablesText: tpl.deliverables.join('\n'),
        });
        setDialogMode('edit');
    }
    function handleSave(e) {
        e.preventDefault();
        const scope = formData.scopeText.split('\n').map((s) => s.trim()).filter(Boolean);
        const deliverables = formData.deliverablesText.split('\n').map((d) => d.trim()).filter(Boolean);
        const price = parseInt(formData.defaultPrice, 10) || 0;
        if (dialogMode === 'create') {
            const newTpl = {
                id: `tpl-${Date.now()}`,
                creatorId: 'u-alex-001',
                name: formData.name.trim(),
                category: formData.category.trim() || 'General',
                description: formData.description.trim(),
                scope: scope.length > 0 ? scope : ['Standard scope'],
                defaultPrice: price,
                currency: 'INR',
                deliverables: deliverables.length > 0 ? deliverables : ['Standard deliverables'],
                usageCount: 0,
                createdAt: new Date().toISOString(),
            };
            setTemplates([newTpl, ...templates]);
        }
        else if (dialogMode === 'edit' && activeTemplate) {
            setTemplates(templates.map((t) => t.id === activeTemplate.id
                ? {
                    ...t,
                    name: formData.name.trim(),
                    category: formData.category.trim(),
                    description: formData.description.trim(),
                    defaultPrice: price,
                    scope: scope.length > 0 ? scope : t.scope,
                    deliverables: deliverables.length > 0 ? deliverables : t.deliverables,
                }
                : t));
        }
        setDialogMode(null);
    }
    function duplicateTemplate(tpl) {
        const copy = {
            ...tpl,
            id: `tpl-${Date.now()}`,
            name: `${tpl.name} (Copy)`,
            usageCount: 0,
            createdAt: new Date().toISOString(),
        };
        setTemplates([copy, ...templates]);
    }
    function deleteTemplate(id) {
        setTemplates(templates.filter((t) => t.id !== id));
    }
    return (<div>
      <app_shell_1.PageHeader title="Templates" description={`${templates.length} reusable deal templates`} action={<button_1.Button onClick={openCreate} className="gap-2">
            <lucide_react_1.Plus className="h-4 w-4"/>
            New Template
          </button_1.Button>}/>

      {/* Dialog for Create / Edit */}
      <dialog_1.Dialog open={dialogMode !== null} onOpenChange={(open) => !open && setDialogMode(null)}>
        <dialog_1.DialogContent className="max-w-lg">
          <dialog_1.DialogHeader>
            <dialog_1.DialogTitle>{dialogMode === 'create' ? 'Create Deal Template' : 'Edit Template'}</dialog_1.DialogTitle>
          </dialog_1.DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label_1.Label htmlFor="tpl-name">Template Name</label_1.Label>
                <input_1.Input id="tpl-name" placeholder="e.g. Website Development" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required/>
              </div>
              <div className="space-y-1.5">
                <label_1.Label htmlFor="tpl-cat">Category</label_1.Label>
                <input_1.Input id="tpl-cat" placeholder="e.g. Web Development" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required/>
              </div>
            </div>

            <div className="space-y-1.5">
              <label_1.Label htmlFor="tpl-desc">Description</label_1.Label>
              <textarea_1.Textarea id="tpl-desc" placeholder="Brief summary of what this template covers..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={2} required/>
            </div>

            <div className="space-y-1.5">
              <label_1.Label htmlFor="tpl-price">Suggested Price (₹)</label_1.Label>
              <input_1.Input id="tpl-price" type="number" placeholder="50000" value={formData.defaultPrice} onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })} required/>
            </div>

            <div className="space-y-1.5">
              <label_1.Label htmlFor="tpl-scope">Scope items (one per line)</label_1.Label>
              <textarea_1.Textarea id="tpl-scope" placeholder="Design prototype&#10;Mobile responsive build&#10;Deployment" value={formData.scopeText} onChange={(e) => setFormData({ ...formData, scopeText: e.target.value })} rows={3}/>
            </div>

            <div className="space-y-1.5">
              <label_1.Label htmlFor="tpl-deliv">Deliverables (one per line)</label_1.Label>
              <textarea_1.Textarea id="tpl-deliv" placeholder="Figma master file&#10;Clean source code" value={formData.deliverablesText} onChange={(e) => setFormData({ ...formData, deliverablesText: e.target.value })} rows={2}/>
            </div>

            <dialog_1.DialogFooter className="pt-2">
              <button_1.Button type="button" variant="outline" onClick={() => setDialogMode(null)}>
                Cancel
              </button_1.Button>
              <button_1.Button type="submit">
                {dialogMode === 'create' ? 'Save Template' : 'Update Template'}
              </button_1.Button>
            </dialog_1.DialogFooter>
          </form>
        </dialog_1.DialogContent>
      </dialog_1.Dialog>

      {templates.length === 0 ? (<card_1.Card>
          <card_1.CardContent className="p-8">
            <empty_state_1.EmptyState icon={lucide_react_1.FileStack} title="No templates yet" description="Create reusable templates to speed up deal creation." actionLabel="Create Template" onAction={openCreate}/>
          </card_1.CardContent>
        </card_1.Card>) : (<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl, i) => (<framer_motion_1.motion.div key={tpl.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
              <card_1.Card className="h-full group flex flex-col justify-between hover:border-primary/40 transition-colors">
                <card_1.CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <lucide_react_1.Tag className="h-3 w-3"/>
                          {tpl.category}
                        </span>
                        <h3 className="font-semibold text-sm mt-1.5">{tpl.name}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">Used {tpl.usageCount}x</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tpl.description}</p>
                    <div className="space-y-1 mb-4">
                      {tpl.scope.slice(0, 3).map((s, idx) => (<div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground"/>
                          <span className="truncate">{s}</span>
                        </div>))}
                      {tpl.scope.length > 3 && (<span className="text-xs text-muted-foreground">+{tpl.scope.length - 3} more scope items</span>)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Suggested price</p>
                      <span className="text-sm font-semibold">{(0, plans_1.formatCurrency)(tpl.defaultPrice, tpl.currency)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <link_1.default href={`/deals/new?template=${tpl.id}`}>
                        <button_1.Button size="sm" className="gap-1.5 h-8">
                          Use
                          <lucide_react_1.ArrowRight className="h-3 w-3"/>
                        </button_1.Button>
                      </link_1.default>
                      <button_1.Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Duplicate template" onClick={() => duplicateTemplate(tpl)}>
                        <lucide_react_1.Copy className="h-3.5 w-3.5"/>
                      </button_1.Button>
                      <button_1.Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit template" onClick={() => openEdit(tpl)}>
                        <lucide_react_1.Pencil className="h-3.5 w-3.5"/>
                      </button_1.Button>
                      <button_1.Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" title="Delete template" onClick={() => deleteTemplate(tpl.id)}>
                        <lucide_react_1.Trash2 className="h-3.5 w-3.5"/>
                      </button_1.Button>
                    </div>
                  </div>
                </card_1.CardContent>
              </card_1.Card>
            </framer_motion_1.motion.div>))}
        </div>)}
    </div>);
}
exports.default = TemplatesPage;
