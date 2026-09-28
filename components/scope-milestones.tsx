'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle2, Circle, GripVertical, Plus, 
  Trash2, Edit2, Check, X, Calendar, ChevronUp, ChevronDown, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Deal, Milestone, MilestoneStatus } from '@/lib/types';

interface ScopeMilestonesProps {
  deal: Deal;
  milestones: Milestone[];
  isCreator: boolean;
  showScope?: boolean;
  showMilestones?: boolean;
}

export function ScopeMilestones({
  deal,
  milestones,
  isCreator,
  showScope = true,
  showMilestones = true,
}: ScopeMilestonesProps) {
  // State for Project Scope
  const [scopeItems, setScopeItems] = useState<string[]>(deal.scope || []);
  const [isEditingScope, setIsEditingScope] = useState(false);
  const [newScopeItem, setNewScopeItem] = useState('');
  const [editingItemIdx, setEditingItemIdx] = useState<number | null>(null);
  const [editingItemText, setEditingItemText] = useState('');
  const [isSavingScope, setIsSavingScope] = useState(false);

  // State for Milestones
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mDueDate, setMDueDate] = useState('');
  const [mStatus, setMStatus] = useState<MilestoneStatus>('pending');
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  useEffect(() => {
    setScopeItems(deal.scope || []);
  }, [deal.scope]);

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
      console.error('Error saving scope:', e);
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
    if (editingItemIdx === idx) {
      setEditingItemIdx(null);
    }
  }

  function startEditItem(idx: number, text: string) {
    setEditingItemIdx(idx);
    setEditingItemText(text);
  }

  function handleSaveEditedItem(idx: number) {
    if (!editingItemText.trim()) return;
    const updated = [...scopeItems];
    updated[idx] = editingItemText.trim();
    saveScope(updated);
    setEditingItemIdx(null);
    setEditingItemText('');
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
            status: mStatus,
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
            status: 'pending',
          }),
        });
      }
      setIsAddingMilestone(false);
      setEditingMilestoneId(null);
      resetMilestoneForm();
    } catch (err) {
      console.error('Error saving milestone:', err);
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
      console.error('Error deleting milestone:', err);
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
      console.error('Error updating milestone status:', err);
    }
  }

  async function handleMoveMilestone(idx: number, direction: 'up' | 'down') {
    if (!isCreator) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === milestones.length - 1) return;

    const sorted = [...milestones].sort((a, b) => a.order - b.order);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;

    const temp = sorted[idx];
    sorted[idx] = sorted[targetIdx];
    sorted[targetIdx] = temp;

    const items = sorted.map((m, i) => ({ id: m.id, order: i }));

    try {
      await fetch(`/api/deals/${deal.dealCode}/milestones/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
    } catch (err) {
      console.error('Error reordering milestones:', err);
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
  const totalCount = sortedMilestones.length;
  const completedCount = sortedMilestones.filter((m) => m.status === 'completed').length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* PROJECT SCOPE CARD */}
      {showScope && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-semibold">Project Scope</CardTitle>
              <CardDescription>
                {isCreator ? 'Agreed work included in this project' : 'Agreed work included in this project'}
              </CardDescription>
            </div>
            {isCreator && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-medium"
                onClick={() => setIsEditingScope(!isEditingScope)}
              >
                {isEditingScope ? 'Done Editing' : 'Edit Scope'}
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {scopeItems.length === 0 && !isEditingScope ? (
              <div className="text-xs text-muted-foreground text-center py-6 border rounded-lg border-dashed">
                No scope items defined yet.
              </div>
            ) : (
              <ul className="space-y-2.5">
                {scopeItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm">
                    <Check className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                    {isCreator && isEditingScope && editingItemIdx === idx ? (
                      <div className="flex-1 flex gap-2 items-center">
                        <Input
                          value={editingItemText}
                          onChange={(e) => setEditingItemText(e.target.value)}
                          className="h-8 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditedItem(idx);
                            } else if (e.key === 'Escape') {
                              setEditingItemIdx(null);
                            }
                          }}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-emerald-500 hover:text-emerald-400"
                          onClick={() => handleSaveEditedItem(idx)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground"
                          onClick={() => setEditingItemIdx(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="flex-1 text-foreground leading-relaxed">{item}</span>
                        {isCreator && isEditingScope && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-foreground"
                              onClick={() => startEditItem(idx, item)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoveScope(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {isCreator && isEditingScope && (
              <form onSubmit={handleAddScope} className="pt-2 flex gap-2">
                <Input
                  placeholder="Add a scope item..."
                  value={newScopeItem}
                  onChange={(e) => setNewScopeItem(e.target.value)}
                  disabled={isSavingScope}
                  className="h-8 text-xs"
                />
                <Button type="submit" size="sm" className="h-8 text-xs" disabled={!newScopeItem.trim() || isSavingScope}>
                  Add
                </Button>
              </form>
            )}

            {isCreator && (
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 pt-2 border-t border-border/40">
                <Info className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span>Operational scope defines live project work. Accepted contracts maintain their historical agreement snapshot.</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* MILESTONES CARD */}
      {showMilestones && (
        <>
          {totalCount === 0 ? (
            isCreator ? (
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-dashed border-border/60 bg-card/40 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Milestones</span>
                  <span>·</span>
                  <span>Optional project execution stages</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs font-medium text-primary hover:text-primary/80 gap-1"
                  onClick={() => {
                    resetMilestoneForm();
                    setEditingMilestoneId(null);
                    setIsAddingMilestone(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" /> Add milestone
                </Button>
              </div>
            ) : null
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-lg font-semibold">Milestones</CardTitle>
                  <CardDescription>Project execution stages and progress</CardDescription>
                </div>
                {isCreator && (
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      resetMilestoneForm();
                      setEditingMilestoneId(null);
                      setIsAddingMilestone(true);
                    }}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Milestone
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Milestone Progress</span>
                    <span className="text-foreground">
                      {completedCount} of {totalCount} completed ({progressPercent}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {sortedMilestones.map((m, idx) => (
                    <div
                      key={m.id}
                      className="group relative flex gap-3.5 p-3.5 rounded-xl border border-border/70 bg-card/60 hover:border-primary/20 transition-colors"
                    >
                      <div className="shrink-0 mt-0.5">
                        {m.status === 'completed' ? (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        ) : m.status === 'in_progress' ? (
                          <Circle className="h-5 w-5 text-blue-500 fill-blue-500/20" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground/60" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4
                            className={`font-medium text-sm truncate ${
                              m.status === 'completed' ? 'text-muted-foreground line-through' : 'text-foreground'
                            }`}
                          >
                            {m.title}
                          </h4>

                          {isCreator && (
                            <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={idx === 0}
                                onClick={() => handleMoveMilestone(idx, 'up')}
                                title="Move Up"
                              >
                                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={idx === totalCount - 1}
                                onClick={() => handleMoveMilestone(idx, 'down')}
                                title="Move Down"
                              >
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => openEditMilestone(m)}
                                title="Edit"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 hover:text-destructive"
                                onClick={() => handleDeleteMilestone(m.id)}
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {m.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {m.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 pt-1.5">
                          {m.dueDate && (
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                              <Calendar className="h-3 w-3" />
                              {new Date(m.dueDate).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                          )}

                          {isCreator ? (
                            <Select value={m.status} onValueChange={(val) => handleStatusChange(m.id, val)}>
                              <SelectTrigger className="h-6 text-[11px] w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider">
                              {m.status === 'completed' ? (
                                <span className="text-primary font-semibold">Completed</span>
                              ) : m.status === 'in_progress' ? (
                                <span className="text-blue-500 font-semibold">In Progress</span>
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
              </CardContent>
            </Card>
          )}

          {/* ADD/EDIT MILESTONE DIALOG */}
          <Dialog open={isAddingMilestone} onOpenChange={setIsAddingMilestone}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMilestoneId ? 'Edit Milestone' : 'Add Milestone'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveMilestone} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="mTitle">Title</Label>
                  <Input
                    id="mTitle"
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    required
                    placeholder="e.g. Initial Wireframes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mDesc">Description (Optional)</Label>
                  <Textarea
                    id="mDesc"
                    value={mDesc}
                    onChange={(e) => setMDesc(e.target.value)}
                    placeholder="Details about stage deliverables..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mDueDate">Due Date (Optional)</Label>
                    <Input id="mDueDate" type="date" value={mDueDate} onChange={(e) => setMDueDate(e.target.value)} />
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
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAddingMilestone(false)}
                    disabled={isSavingMilestone}
                  >
                    Cancel
                  </Button>
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
