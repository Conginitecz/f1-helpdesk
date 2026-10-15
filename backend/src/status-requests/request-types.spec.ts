import { describe, expect, it } from 'vitest';
import { StatusChangeRequest } from './status-requests.entity.js';
import { StatusRequestStatus, StatusRequestType } from './request-types.js';

describe('status request model foundation', () => {
  it('defines exactly the five approved request types', () => {
    expect(Object.values(StatusRequestType)).toEqual([
      'VENDOR_ONBOARDING',
      'VENDOR_ACTIVATION',
      'VENDOR_DEACTIVATION',
      'ENGINEER_ACTIVATION',
      'ENGINEER_DEACTIVATION',
    ]);
  });

  it('preserves existing lowercase request status values', () => {
    expect(Object.values(StatusRequestStatus)).toEqual([
      'pending',
      'approved',
      'rejected',
    ]);
  });

  it('allows legacy request rows to remain unmapped and reasonless', () => {
    const request = new StatusChangeRequest();
    request.requestType = null;
    request.reason = null;

    expect(request.requestType).toBeNull();
    expect(request.reason).toBeNull();
  });
});
