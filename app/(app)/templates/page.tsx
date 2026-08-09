'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FileStack, Plus, Copy, Trash2, Pencil, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { DEMO_TEMPLATES } from '@/lib/demo-data';
import { formatCurrency } from '@/lib/plans';
import type { DealTemplate } from '@/lib/types';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<DealTemplate[]>(DEMO_TEMPLATES);

  function duplicateTemplate(tpl: DealTemplate) {
    const copy: DealTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}`,
      name: `${tpl.name} (Copy)`,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    setTemplates([...templates, copy]);
  }

  function deleteTemplate(id: string) {
    setTemplates(templates.filter((t) => t.id !== id));
  }

  return (
    <div>
      <PageHeader
        title="Templates"
        description={`${templates.length} templates`}
        action={
          <Button variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        }
      />

      {templates.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FileStack}
              title="No templates yet"
              description="Create reusable templates to speed up deal creation."
              actionLabel="Create Template"
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl, i) => (
            <motion.div
              key={tpl.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <Card className="h-full group">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">{tpl.category}</span>
                      <h3 className="font-semibold text-sm mt-0.5">{tpl.name}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">Used {tpl.usageCount}x</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{tpl.description}</p>
                  <div className="space-y-1 mb-4">
                    {tpl.scope.slice(0, 3).map((s, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        {s}
                      </div>
                    ))}
                    {tpl.scope.length > 3 && (
                      <span className="text-xs text-muted-foreground">+{tpl.scope.length - 3} more</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-sm font-semibold">{formatCurrency(tpl.defaultPrice, tpl.currency)}</span>
                    <div className="flex items-center gap-1">
                      <Link href="/deals/new">
                        <Button size="sm" className="gap-1.5">
                          Use
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => duplicateTemplate(tpl)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTemplate(tpl.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
