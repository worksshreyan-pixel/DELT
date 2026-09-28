import type { Deal, Deliverable, FileVersion } from '@/lib/types';

/**
 * Returns the exact canonical agreed deliverables list for a deal.
 * Both Creator workspace and Client workspace MUST use this function
 * to render their agreed deliverables and file sections, guaranteeing 100%
 * data equality across both sides for any deal.
 */
export function getCanonicalDeliverables(
  deal: Deal,
  dbDeliverables: Deliverable[] = [],
  fileVersions: FileVersion[] = []
): Deliverable[] {
  // 1. Primary source of agreed items: deal.scope
  const scopeItems = Array.isArray(deal.scope) && deal.scope.length > 0 ? deal.scope : [];

  // If deal.scope is defined, build deliverables list directly from deal.scope in exact order
  if (scopeItems.length > 0) {
    const canonicalScopeDeliverables: Deliverable[] = scopeItems.map((item, idx) => {
      // Find matching DB deliverable row by name (case-insensitive) or index
      const dbMatch = dbDeliverables.find(
        (d) => d.name.trim().toLowerCase() === item.trim().toLowerCase() && !d.name.startsWith('[DELETED]')
      ) || (dbDeliverables[idx] && !dbDeliverables[idx].name.startsWith('[DELETED]') ? dbDeliverables[idx] : undefined);

      if (dbMatch) {
        return {
          ...dbMatch,
          name: item, // Ensure exact agreed scope string
        };
      }

      // Fallback deterministic object if DB row hasn't been created/synced yet
      return {
        id: `del-scope-${idx}`,
        dealId: deal.id,
        name: item,
        status: (deal.paymentStatus === 'paid' || deal.status === 'completed') ? 'approved' : 'pending',
        createdAt: deal.createdAt,
      };
    });

    // 2. Preserve any extra operational DB deliverables that have actual file versions attached
    const extraWithFiles = dbDeliverables.filter(
      (d) =>
        !d.name.startsWith('[DELETED]') &&
        !canonicalScopeDeliverables.some((csd) => csd.id === d.id || csd.name.trim().toLowerCase() === d.name.trim().toLowerCase()) &&
        fileVersions.some((fv) => fv.deliverableId === d.id && Array.isArray(fv.files) && fv.files.length > 0)
    );

    return [...canonicalScopeDeliverables, ...extraWithFiles];
  }

  // 2. If deal.scope is explicitly empty (e.g. [], scope removed), only preserve DB deliverables that have actual files attached
  const fileBackedDelivs = dbDeliverables.filter(
    (d) =>
      !d.name.startsWith('[DELETED]') &&
      fileVersions.some((fv) => fv.deliverableId === d.id && Array.isArray(fv.files) && fv.files.length > 0)
  );

  return fileBackedDelivs;
}
