import { describe, expect, it } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from './auth/jwt-auth.guard.js';
import { RolesGuard } from './auth/roles.guard.js';
import { Role } from './auth/roles.enum.js';
import { ROLES_KEY } from './auth/roles.decorator.js';
import { AdminsController } from './admins/admins.controller.js';
import { LocationsController } from './locations/locations.controller.js';
import { PartnersController, AdminPartnersController } from './partners/partners.controller.js';
import { InventoryController, AdminInventoryController } from './inventory/inventory.controller.js';
import { StatusRequestsController, AdminStatusRequestsController } from './status-requests/status-requests.controller.js';
import { ConfigurationsController } from './configurations/configurations.controller.js';
import { MasterDataController, AdminMasterDataController } from './master-data/master-data.controller.js';

describe('M1 authorization route boundaries', () => {
  it.each([
    [AdminsController, Role.SUPER_ADMIN],
    [LocationsController, Role.SUPER_ADMIN],
    [PartnersController, Role.SUPER_ADMIN],
    [InventoryController, Role.SUPER_ADMIN],
    [StatusRequestsController, Role.SUPER_ADMIN],
    [ConfigurationsController, Role.SUPER_ADMIN],
    [MasterDataController, Role.SUPER_ADMIN],
    [AdminPartnersController, Role.ADMIN],
    [AdminInventoryController, Role.ADMIN],
    [AdminStatusRequestsController, Role.ADMIN],
    [AdminMasterDataController, Role.ADMIN],
  ])('%s requires JWT and the expected role', (controller, role) => {
    expect(Reflect.getMetadata(GUARDS_METADATA, controller)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, controller)).toEqual([role]);
  });
});
