export enum PartnerLifecycleStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  REJECTED = 'REJECTED',
}

export function compatibilityIsActive(
  lifecycleStatus: PartnerLifecycleStatus | null | undefined,
  existingIsActive: boolean,
): boolean {
  return lifecycleStatus === null || lifecycleStatus === undefined
    ? existingIsActive
    : lifecycleStatus === PartnerLifecycleStatus.ACTIVE;
}
