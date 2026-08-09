'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  FolderKanban,
  IndianRupee,
  FileCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  CheckCircle2,
  Link as LinkIcon,
  Copy,
} from 'lucide-react';
import { Breadcrumb } from '@/components/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/plans';

const steps = [
  { id: 'client', label: 'Client', icon: User },
  { id: 'project', label: 'Project', icon: FolderKanban },
  { id: 'pricing', label: 'Pricing', icon: IndianRupee },
  { id: 'deliverables', label: 'Deliverables', icon: FileCheck },
  { id: 'review', label: 'Review', icon: Check },
];

interface DealFormData {
  clientName: string;
  clientEmail: string;
  title: string;
  description: string;
  scope: string[];
  deadline: string;
  price: string;
  currency: string;
  deliverables: string[];
}

export default function CreateDealPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [created, setCreated] = useState(false);
  const [dealToken, setDealToken] = useState('');
  const [data, setData] = useState<DealFormData>({
    clientName: '',
    clientEmail: '',
    title: '',
    description: '',
    scope: [],
    deadline: '',
    price: '',
    currency: 'INR',
    deliverables: [],
  });
  const [scopeInput, setScopeInput] = useState('');
  const [deliverableInput, setDeliverableInput] = useState('');

  function update(field: keyof DealFormData, value: string | string[]) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function addScope() {
    if (scopeInput.trim()) {
      update('scope', [...data.scope, scopeInput.trim()]);
      setScopeInput('');
    }
  }
  function removeScope(idx: number) {
    update('scope', data.scope.filter((_, i) => i !== idx));
  }
  function addDeliverable() {
    if (deliverableInput.trim()) {
      update('deliverables', [...data.deliverables, deliverableInput.trim()]);
      setDeliverableInput('');
    }
  }
  function removeDeliverable(idx: number) {
    update('deliverables', data.deliverables.filter((_, i) => i !== idx));
  }

  function canProceed() {
    switch (step) {
      case 0: return data.clientName && data.clientEmail;
      case 1: return data.title && data.description;
      case 2: return data.price;
      default: return true;
    }
  }

  function handleCreate() {
    const token = `dl_${Math.random().toString(36).slice(2, 14)}`;
    setDealToken(token);
    setCreated(true);
  }

  if (created) {
    return (
      <div className="mx-auto max-w-lg">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950">
                <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-xl font-display font-semibold tracking-tight mb-1">Deal created</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Your deal is ready. Share the private link with your client to get started.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 mb-6">
                <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 truncate text-sm font-mono">delt.app/deal/{dealToken}</span>
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={() => router.push('/deals')}>
                  Go to Deals
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => router.push(`/deal/${dealToken}`)}>
                  Preview client view
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: 'Deals', href: '/deals' }, { label: 'New Deal' }]} />

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, i) => (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border-2 transition-colors',
                    i < step
                      ? 'border-primary bg-primary text-primary-foreground'
                      : i === step
                        ? 'border-primary bg-background text-primary'
                        : 'border-border bg-background text-muted-foreground'
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                </div>
                <span className={cn('text-xs font-medium', i <= step ? 'text-foreground' : 'text-muted-foreground')}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('mx-2 h-0.5 flex-1 rounded-full', i < step ? 'bg-primary' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              {/* Step 1: Client */}
              {step === 0 && (
                <div className="space-y-4 max-w-md">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Client details</h2>
                    <p className="text-sm text-muted-foreground">Who is this deal for?</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName">Client name</Label>
                    <Input
                      id="clientName"
                      placeholder="Sarah Mitchell"
                      value={data.clientName}
                      onChange={(e) => update('clientName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail">Client email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      placeholder="sarah@brightsmiledental.com"
                      value={data.clientEmail}
                      onChange={(e) => update('clientEmail', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The client will verify this email via OTP to access the deal.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Project */}
              {step === 1 && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Project details</h2>
                    <p className="text-sm text-muted-foreground">Describe the work and scope.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Project title</Label>
                    <Input
                      id="title"
                      placeholder="Clinic Website Redesign"
                      value={data.title}
                      onChange={(e) => update('title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Complete redesign of the website with modern, calming aesthetic..."
                      rows={4}
                      value={data.description}
                      onChange={(e) => update('description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Scope items</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a scope item..."
                        value={scopeInput}
                        onChange={(e) => setScopeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addScope(); } }}
                      />
                      <Button variant="outline" size="icon" onClick={addScope}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {data.scope.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {data.scope.map((s, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                            <span className="text-sm">{s}</span>
                            <button onClick={() => removeScope(i)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={data.deadline}
                      onChange={(e) => update('deadline', e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Pricing */}
              {step === 2 && (
                <div className="space-y-4 max-w-md">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Pricing</h2>
                    <p className="text-sm text-muted-foreground">Set the deal amount and currency.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="62000"
                        value={data.price}
                        onChange={(e) => update('price', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <select
                        id="currency"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={data.currency}
                        onChange={(e) => update('currency', e.target.value)}
                      >
                        <option value="INR">INR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                  </div>
                  {data.price && (
                    <div className="rounded-lg bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Deal amount</p>
                      <p className="text-lg font-semibold">{formatCurrency(Number(data.price), data.currency as 'INR' | 'USD' | 'EUR' | 'GBP')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Deliverables */}
              {step === 4 - 1 && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Deliverables</h2>
                    <p className="text-sm text-muted-foreground">What will you deliver to the client?</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Deliverable items</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a deliverable..."
                        value={deliverableInput}
                        onChange={(e) => setDeliverableInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDeliverable(); } }}
                      />
                      <Button variant="outline" size="icon" onClick={addDeliverable}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {data.deliverables.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        {data.deliverables.map((d, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                            <span className="text-sm">{d}</span>
                            <button onClick={() => removeDeliverable(i)} className="text-muted-foreground hover:text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {data.deliverables.length === 0 && (
                      <p className="text-xs text-muted-foreground">You can add deliverables later if needed.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Review */}
              {step === 4 && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Review and create</h2>
                    <p className="text-sm text-muted-foreground">Check the details before creating the deal.</p>
                  </div>
                  <div className="space-y-3">
                    <ReviewRow label="Client" value={`${data.clientName} (${data.clientEmail})`} />
                    <ReviewRow label="Project" value={data.title} />
                    <ReviewRow label="Description" value={data.description} />
                    <ReviewRow label="Scope" value={data.scope.join(', ') || '—'} />
                    <ReviewRow label="Deadline" value={data.deadline ? new Date(data.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
                    <ReviewRow label="Price" value={data.price ? formatCurrency(Number(data.price), data.currency as 'INR' | 'USD' | 'EUR' | 'GBP') : '—'} />
                    <ReviewRow label="Deliverables" value={data.deliverables.join(', ') || '—'} />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => step > 0 ? setStep(step - 1) : router.push('/deals')}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              {step === 0 ? 'Cancel' : 'Back'}
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="gap-1.5">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleCreate} className="gap-1.5">
                <Check className="h-4 w-4" />
                Create Deal
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border pb-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value || '—'}</span>
    </div>
  );
}
