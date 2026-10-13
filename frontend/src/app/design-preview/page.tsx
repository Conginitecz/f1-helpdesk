"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Badge, CheckpointBadge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { MonoTd, Table, TableWrap, Td, Th, Tr } from "@/components/ui/data-table";
import { Checkbox, SelectField, TextField, TextareaField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Panel } from "@/components/ui/panel";
import { ScreenState } from "@/components/screen-state";

/*
 * /design-preview - a developer reference sheet for the shared components
 * built in Phase 2 step b.
 *
 * It is not linked from any navigation and holds no data: it exists so every
 * component state (default, hover, disabled, error, empty, loading, modal open)
 * can be inspected and browser-verified at the three breakpoints without
 * having to drive a real screen. Screens adopt these components in steps d/e.
 */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-space-xl">
      <h2 className="font-headline text-headline-md text-text-primary">{title}</h2>
      <div className="mt-space-sm flex flex-wrap items-start gap-space-md">{children}</div>
    </section>
  );
}

export default function DesignPreviewPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="mx-auto w-full max-w-5xl px-space-md py-space-lg sm:px-space-lg">
      <header>
        <p className="font-body text-label-sm uppercase tracking-wider text-text-muted">
          F1 Help Desk / Phase 2 step b
        </p>
        <h1 className="mt-1 font-headline text-headline-lg text-text-primary">Shared component sheet</h1>
        <p className="mt-1 font-body text-body-md text-text-muted">
          Every value below comes from docs/design/design-system/DESIGN.md through the tokens in
          src/styles/tokens.css. This page is a developer reference and is not linked from navigation.
        </p>
      </header>

      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled>Disabled</Button>
        <Button variant="secondary" size="compact">
          Compact action
        </Button>
        <Button>
          <Icon name="add" size={16} />
          With icon
        </Button>
      </Section>

      <Section title="Badges">
        <Badge tone="positive">Verified</Badge>
        <Badge tone="negative">Suspended</Badge>
        <Badge tone="pending">Certification pending</Badge>
        <Badge>Draft</Badge>
        <CheckpointBadge>PO-09 pending confirmation</CheckpointBadge>
      </Section>

      <Section title="Form fields">
        <div className="grid w-full gap-space-md sm:grid-cols-2">
          <TextField hint="Used to sign in." label="Email" placeholder="name@example.com" />
          <TextField defaultValue="Demo Item" label="Item name" />
          <TextField error="This location already exists." label="Location name" defaultValue="Test Location" />
          <SelectField label="Assign a location" defaultValue="">
            <option value="">Choose a location</option>
            <option value="1">Test Location</option>
          </SelectField>
          <TextareaField label="Address" placeholder="Street, city, postcode" />
          <div className="flex flex-col gap-space-sm pt-space-lg">
            <Checkbox defaultChecked label="Notify the customer on status change" />
            <Checkbox label="Requires product owner confirmation" />
          </div>
        </div>
      </Section>

      <Section title="Panel and banners">
        <div className="w-full space-y-space-md">
          <Banner title="[PO-09: Incorrect Diagnosis Liability]" tone="checkpoint">
            <p>The rules below this checkpoint are provisional until the product owner confirms them.</p>
          </Banner>
          <Banner tone="info" title="Scheduled maintenance">
            <p>Inventory sync pauses for two minutes every hour.</p>
          </Banner>
          <Banner tone="danger" title="Vendor licence expired">
            <p>Orders cannot be assigned to this vendor until the licence is renewed.</p>
          </Banner>
          <Panel action={<Button size="compact" variant="secondary">View all</Button>} title="Panel with header">
            <p className="font-body text-body-md text-text-muted">
              Level 1 surface: white card, 1px #D9E3EA border, 8px radius, subtle shadow.
            </p>
          </Panel>
        </div>
      </Section>

      <Section title="Data table">
        <div className="w-full">
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Request</Th>
                  <Th>Status</Th>
                  <Th>Engineer</Th>
                  <Th>Fee</Th>
                </tr>
              </thead>
              <tbody>
                <Tr>
                  <MonoTd>#REQ-CH-9812</MonoTd>
                  <Td>
                    <Badge tone="positive">Verified</Badge>
                  </Td>
                  <Td>A. Kumar</Td>
                  <MonoTd>1,250.00</MonoTd>
                </Tr>
                <Tr>
                  <MonoTd>#REQ-CH-9813</MonoTd>
                  <Td>
                    <Badge tone="pending">In progress</Badge>
                  </Td>
                  <Td>S. Rao</Td>
                  <MonoTd>860.50</MonoTd>
                </Tr>
              </tbody>
            </Table>
          </TableWrap>
        </div>
      </Section>

      <Section title="Loading, empty and error states">
        <div className="grid w-full gap-space-md md:grid-cols-3">
          <ScreenState kind="loading" message="Loading requests…" />
          <ScreenState kind="empty" message="No vendors yet." />
          <ScreenState
            kind="error"
            message="Could not load the inventory."
            onRetry={() => undefined}
          />
        </div>
      </Section>

      <Section title="Modal">
        <Button onClick={() => setModalOpen(true)} variant="secondary">
          Open dialog
        </Button>
        <p className="w-full font-body text-body-sm text-text-muted">
          Below 768px it becomes a bottom sheet with the action bar pinned; from 768px it is a centred
          panel. Escape, the close button and the backdrop all dismiss it.
        </p>
      </Section>

      <Modal
        actions={
          <>
            <Button onClick={() => setModalOpen(false)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </>
        }
        description="Destructive actions ask for confirmation first."
        onClose={() => setModalOpen(false)}
        open={modalOpen}
        title="Suspend this partner?"
      >
        <p className="font-body text-body-md text-text-primary">
          The partner stops receiving new orders until the licence is restored. Existing requests are
          unaffected.
        </p>
      </Modal>
    </main>
  );
}