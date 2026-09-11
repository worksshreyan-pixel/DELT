'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, Circle, Clock, GripVertical, Plus, 
  Trash2, Edit2, Check, X, Calendar 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Deal, Milestone, MilestoneStatus } from '@/lib/types';

interface ScopeMilestonesProps {
  deal: Deal;
  milestones: Milestone[];
  isCreator: boolean;
  showScope?: boolean;
  showMilestones?: boolean;
}

export function ScopeMilestones({ deal, milestones, isCreator, showScope = true, showMilestones = true }: ScopeMilestonesProps) {
  // State for Scope
  const [scopeItems, setScopeItems] = useState<string[]>(deal.scope || []);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const [newScopeItem, setNewScopeItem] = useState('');
  const [isSavingScope, setIsSavingScope] = useState(false);

  // State for Milestones
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mDueDate, setMDueDate] = useState('');
  const [mStatus, setMStatus] = useState<MilestoneStatus>('pending');
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  // Scope mutations
  async function saveScope(newScope: string[]) {
    if (!isCreator) return;
    setIsSavingScope(true);
    try {
      await fetch(`/api/deals/${deal.dealCode}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: newScope }),
      });
      setScopeItems(newScope);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingScope(false);
    }
  }

  function handleAddScope(e: React.FormEvent) {
    e.preventDefault();
    if (!newScopeItem.trim()) return;
    const updated = [...scopeItems, newScopeItem.trim()];
    saveScope(updated);
    setNewScopeItem('');
  }

  function handleRemoveScope(idx: number) {
    const updated = [...scopeItems];
    updated.splice(idx, 1);
    saveScope(updated);
  }

  // Milestone mutations
  async function handleSaveMilestone(e: React.FormEvent) {
    e.preventDefault();
    if (!isCreator || !mTitle.trim()) return;
    setIsSavingMilestone(true);
    
    try {
      if (editingMilestoneId) {
        await fetch(`/api/deals/${deal.dealCode}/milestones/${editingMilestoneId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: mTitle.trim(), 
            description: mDesc.trim(), 
            dueDate: mDueDate || null,
            status: mStatus
          }),
        });
      } else {
        await fetch(`/api/deals/${deal.dealCode}/milestones`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: mTitle.trim(), 
            description: mDesc.trim(), 
            dueDate: mDueDate || null,
            order: milestones.length,
            status: 'pending'
          }),
        });
      }
      setIsAddingMilestone(false);
      setEditingMilestoneId(null);
      resetMilestoneForm();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMilestone(false);
    }
  }

  async function handleDeleteMilestone(id: string) {
    if (!isCreator) return;
    if (!confirm('Are you sure you want to delete this milestone?')) return;
    try {
      await fetch(`/api/deals/${deal.dealCode}/milestones/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleStatusChange(id: string, newStatus: string) {
    if (!isCreator) return;
    try {
      await fetch(`/api/deals/${deal.dealCode}/milestones/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleMoveMilestone(idx: number, direction: 'up' | 'down') {
    if (!isCreator) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === milestones.length - 1) return;

    const newMilestones = [...milestones];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    // Swap
    const temp = newMilestones[idx];
    newMilestones[idx] = newMilestones[targetIdx];
    newMilestones[targetIdx] = temp;

    // Update orders
    const items = newMilestones.map((m, i) => ({ id: m.id, order: i }));

    // Optimistically could update state, but we rely on realtime

    try {
      await fetch(`/api/deals/${deal.dealCode}/milestones/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error(err);
    }
  }

  function resetMilestoneForm() {
    setMTitle('');
    setMDesc('');
    setMDueDate('');
    setMStatus('pending');
  }

  function openEditMilestone(m: Milestone) {
    setMTitle(m.title);
    setMDesc(m.description || '');
    setMDueDate(m.dueDate ? m.dueDate.split('T')[0] : '');
    setMStatus(m.status);
    setEditingMilestoneId(m.id);
    setIsAddingMilestone(true);
  }

  const sortedMilestones = [...milestones].sort((a, b) => a.order - b.order);
  const progressSum = milestones.reduce((acc, m) => acc + (m.status === 'completed' ? 100 : m.status === 'in_progress' ? 50 : 0), 0);
  const progressPercent = milestones.length > 0 ? Math.round(progressSum / milestones.length) : 0;

  return (
    <div className="space-y-6">
      {/* SCOPE CARD */}
      {showScope && (
        <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Deal Scope</CardTitle>
            <CardDescription>High-level requirements and objectives</CardDescription>
          </div>
          {isCreator && (
            <Button variant="outline" size="sm" onClick={() => setIsEditingScope(!isEditingScope)}>
              {isEditingScope ? 'Done' : 'Edit Scope'}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {scopeItems.length === 0 && !isEditingScope ? (
            <div className="text-sm text-muted-foreground text-center py-6 border rounded-lg border-dashed">
              No scope items defined.
            </div>
          ) : (
            <ul className="space-y-3">
              {scopeItems.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  <span className="flex-1 text-foreground leading-relaxed">{item}</span>
                  {isCreator && isEditingScope && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleRemoveScope(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {isCreator && isEditingScope && (
            <form onSubmit={handleAddScope} className="mt-4 flex gap-2">
              <Input 
                placeholder="Add a scope requirement..." 
                value={newScopeItem} 
                onChange={(e) => setNewScopeItem(e.target.value)} 
                disabled={isSavingScope}
              />
              <Button type="submit" size="sm" disabled={!newScopeItem.trim() || isSavingScope}>
                Add
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      )}

      {/* MILESTONES CARD */}
      {showMilestones && (
      <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg">Milestones</CardTitle>
            <CardDescription>Detailed project workflow and progress</CardDescription>
          </div>
          {isCreator && (
            <Button size="sm" onClick={() => { resetMilestoneForm(); setEditingMilestoneId(null); setIsAddingMilestone(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Milestone
            </Button>
          )}
        </CardHeader>
        <CardContent>
          
          {milestones.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-muted-foreground">Overall Progress</span>
                <span className="font-medium text-foreground">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          {sortedMilestones.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8 border rounded-lg border-dashed">
              No milestones created yet.
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMilestones.map((m, idx) => (
                <div key={m.id} className="group relative flex gap-4 p-4 rounded-xl border bg-card hover:border-primary/20 transition-colors">
                  
                  {isCreator && (
                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity justify-center absolute -left-10 h-full">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveMilestone(idx, 'up')} disabled={idx === 0}>
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleMoveMilestone(idx, 'down')} disabled={idx === sortedMilestones.length - 1}>
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="shrink-0 mt-0.5">
                    {m.status === 'completed' ? (
                      <CheckCircle2 className="h-6 w-6 text-primary" />
                    ) : m.status === 'in_progress' ? (
                      <Circle className="h-6 w-6 text-blue-500 fill-blue-500/20" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-medium text-base ${m.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                        {m.title}
                      </h4>
                      
                      {isCreator && (
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditMilestone(m)}>
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => handleDeleteMilestone(m.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {m.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {m.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 pt-2">
                      {m.dueDate && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(m.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                      
                      {isCreator ? (
                        <Select value={m.status} onValueChange={(val) => handleStatusChange(m.id, val)}>
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
                          {m.status === 'completed' ? (
                            <span className="text-primary">Completed</span>
                          ) : m.status === 'in_progress' ? (
                            <span className="text-blue-500">In Progress</span>
                          ) : (
                            <span className="text-muted-foreground">Pending</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ADD/EDIT MILESTONE DIALOG */}
      <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMilestoneId ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMilestone} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="mTitle">Title</Label>
              <Input id="mTitle" value={mTitle} onChange={e => setMTitle(e.target.value)} required placeholder="e.g. Initial Wireframes" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mDesc">Description (Optional)</Label>
              <Textarea id="mDesc" value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Provide details about what needs to be delivered..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mDueDate">Due Date (Optional)</Label>
                <Input id="mDueDate" type="date" value={mDueDate} onChange={e => setMDueDate(e.target.value)} />
              </div>
              {editingMilestoneId && (
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={mStatus} onValueChange={(v: any) => setMStatus(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsAddingMilestone(false)} disabled={isSavingMilestone}>Cancel</Button>
              <Button type="submit" disabled={!mTitle.trim() || isSavingMilestone}>
                {isSavingMilestone ? 'Saving...' : 'Save Milestone'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      </>
      )}
    </div>
  );
}
