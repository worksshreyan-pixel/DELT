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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileStack, Plus, Copy, Trash2, Pencil, ArrowRight, Tag } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { EmptyState } from '@/components/empty-state';
import { STANDARD_TEMPLATES } from '@/lib/app-store';
import { formatCurrency } from '@/lib/plans';
export default function TemplatesPage() {
    var _a = useState(STANDARD_TEMPLATES), templates = _a[0], setTemplates = _a[1];
    var _b = useState(null), dialogMode = _b[0], setDialogMode = _b[1];
    var _c = useState(null), activeTemplate = _c[0], setActiveTemplate = _c[1];
    // Form state
    var _d = useState({
        name: '',
        category: 'Web Development',
        description: '',
        defaultPrice: '',
        scopeText: '',
        deliverablesText: '',
    }), formData = _d[0], setFormData = _d[1];
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
        var scope = formData.scopeText.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        var deliverables = formData.deliverablesText.split('\n').map(function (d) { return d.trim(); }).filter(Boolean);
        var price = parseInt(formData.defaultPrice, 10) || 0;
        if (dialogMode === 'create') {
            var newTpl = {
                id: "tpl-".concat(Date.now()),
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
            setTemplates(__spreadArray([newTpl], templates, true));
        }
        else if (dialogMode === 'edit' && activeTemplate) {
            setTemplates(templates.map(function (t) {
                return t.id === activeTemplate.id
                    ? __assign(__assign({}, t), { name: formData.name.trim(), category: formData.category.trim(), description: formData.description.trim(), defaultPrice: price, scope: scope.length > 0 ? scope : t.scope, deliverables: deliverables.length > 0 ? deliverables : t.deliverables }) : t;
            }));
        }
        setDialogMode(null);
    }
    function duplicateTemplate(tpl) {
        var copy = __assign(__assign({}, tpl), { id: "tpl-".concat(Date.now()), name: "".concat(tpl.name, " (Copy)"), usageCount: 0, createdAt: new Date().toISOString() });
        setTemplates(__spreadArray([copy], templates, true));
    }
    function deleteTemplate(id) {
        setTemplates(templates.filter(function (t) { return t.id !== id; }));
    }
    return (<div>
      <PageHeader title="Templates" description={"".concat(templates.length, " reusable deal templates")} action={<Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4"/>
            New Template
          </Button>}/>

      {/* Dialog for Create / Edit */}
      <Dialog open={dialogMode !== null} onOpenChange={function (open) { return !open && setDialogMode(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialogMode === 'create' ? 'Create Deal Template' : 'Edit Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">Template Name</Label>
                <Input id="tpl-name" placeholder="e.g. Website Development" value={formData.name} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { name: e.target.value })); }} required/>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-cat">Category</Label>
                <Input id="tpl-cat" placeholder="e.g. Web Development" value={formData.category} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { category: e.target.value })); }} required/>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-desc">Description</Label>
              <Textarea id="tpl-desc" placeholder="Brief summary of what this template covers..." value={formData.description} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { description: e.target.value })); }} rows={2} required/>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-price">Suggested Price (₹)</Label>
              <Input id="tpl-price" type="number" placeholder="50000" value={formData.defaultPrice} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { defaultPrice: e.target.value })); }} required/>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-scope">Scope items (one per line)</Label>
              <Textarea id="tpl-scope" placeholder="Design prototype&#10;Mobile responsive build&#10;Deployment" value={formData.scopeText} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { scopeText: e.target.value })); }} rows={3}/>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-deliv">Deliverables (one per line)</Label>
              <Textarea id="tpl-deliv" placeholder="Figma master file&#10;Clean source code" value={formData.deliverablesText} onChange={function (e) { return setFormData(__assign(__assign({}, formData), { deliverablesText: e.target.value })); }} rows={2}/>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={function () { return setDialogMode(null); }}>
                Cancel
              </Button>
              <Button type="submit">
                {dialogMode === 'create' ? 'Save Template' : 'Update Template'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {templates.length === 0 ? (<Card>
          <CardContent className="p-8">
            <EmptyState icon={FileStack} title="No templates yet" description="Create reusable templates to speed up deal creation." actionLabel="Create Template" onAction={openCreate}/>
          </CardContent>
        </Card>) : (<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map(function (tpl, i) { return (<motion.div key={tpl.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: i * 0.03 }}>
              <Card className="h-full group flex flex-col justify-between hover:border-primary/40 transition-colors">
                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          <Tag className="h-3 w-3"/>
                          {tpl.category}
                        </span>
                        <h3 className="font-semibold text-sm mt-1.5">{tpl.name}</h3>
                      </div>
                      <span className="text-xs text-muted-foreground">Used {tpl.usageCount}x</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tpl.description}</p>
                    <div className="space-y-1 mb-4">
                      {tpl.scope.slice(0, 3).map(function (s, idx) { return (<div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground"/>
                          <span className="truncate">{s}</span>
                        </div>); })}
                      {tpl.scope.length > 3 && (<span className="text-xs text-muted-foreground">+{tpl.scope.length - 3} more scope items</span>)}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Suggested price</p>
                      <span className="text-sm font-semibold">{formatCurrency(tpl.defaultPrice, tpl.currency)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link href={"/deals/new?template=".concat(tpl.id)}>
                        <Button size="sm" className="gap-1.5 h-8">
                          Use
                          <ArrowRight className="h-3 w-3"/>
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Duplicate template" onClick={function () { return duplicateTemplate(tpl); }}>
                        <Copy className="h-3.5 w-3.5"/>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit template" onClick={function () { return openEdit(tpl); }}>
                        <Pencil className="h-3.5 w-3.5"/>
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" title="Delete template" onClick={function () { return deleteTemplate(tpl.id); }}>
                        <Trash2 className="h-3.5 w-3.5"/>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>); })}
        </div>)}
    </div>);
}
