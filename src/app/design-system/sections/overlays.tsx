"use client";

import { useOverlayState } from "@heroui/react";
import { FunnelIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ResponsiveOverlay } from "@/components/shared/responsive-overlay";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { ModalDialog } from "@/components/ui/modal-dialog";
import { AppSelect } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/selection-controls";
import { Tabs } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { Demo, Section } from "../section";

const prices = [
  { id: "any", label: "Any price" },
  { id: "under-1000", label: "Under ₹1,000 / day" },
  { id: "1000-1500", label: "₹1,000 – ₹1,500 / day" },
  { id: "over-1500", label: "Over ₹1,500 / day" },
];
const brands = ["Royal Enfield", "Yamaha", "KTM", "Honda", "TVS", "Hero", "BMW"].map((b) => ({ id: b, label: b }));

function FilterFields() {
  const [category, setCategory] = useState("all");
  const [price, setPrice] = useState("any");
  const [brand, setBrand] = useState("Royal Enfield");
  const [abs, setAbs] = useState(true);

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        aria-label="Bike category"
        selectedKey={category}
        onSelectionChange={setCategory}
        items={[
          { id: "all", label: "All" },
          { id: "cruiser", label: "Cruiser" },
          { id: "sports", label: "Sports" },
          { id: "adventure", label: "Adventure" },
        ]}
      />
      <AppSelect label="Price range" options={prices} value={price} onChange={(k) => k && setPrice(String(k))} />
      <AppSelect label="Brand" options={brands} value={brand} onChange={(k) => k && setBrand(String(k))} />
      <Checkbox isSelected={abs} onChange={setAbs}>
        ABS only
      </Checkbox>
    </div>
  );
}

export function OverlaysSection() {
  const sheet = useOverlayState();
  const dialog = useOverlayState();

  return (
    <Section
      id="overlays"
      title="Overlays"
      description="HeroUI owns focus trapping, scroll lock, Esc and swipe-to-dismiss. Selects open inside sheets without clipping."
    >
      <div className="grid gap-8 md:grid-cols-2">
        <Demo title="Bottom sheet (filters, contains selects)">
          <Button variant="secondary" onPress={sheet.open}>
            <FunnelIcon size={20} />
            Filters
          </Button>
          <BottomSheet
            isOpen={sheet.isOpen}
            onOpenChange={sheet.setOpen}
            title="Filters"
            footer={
              <>
                <Button variant="secondary" slot="close" fullWidth>
                  Reset
                </Button>
                <Button slot="close" fullWidth onPress={() => toast.success("Filters applied")}>
                  Show 24 bikes
                </Button>
              </>
            }
          >
            <FilterFields />
          </BottomSheet>
        </Demo>

        <Demo title="Responsive overlay (sheet on mobile, popover from 768px)">
          <ResponsiveOverlay
            title="Filters"
            triggerLabel={
              <>
                <FunnelIcon size={20} />
                Filters
              </>
            }
            triggerProps={{ variant: "secondary" }}
            footer={
              <Button fullWidth slot="close">
                Apply
              </Button>
            }
          >
            <FilterFields />
          </ResponsiveOverlay>
        </Demo>

        <Demo title="Modal dialog">
          <Button variant="secondary" onPress={dialog.open}>
            Cancel booking
          </Button>
          <ModalDialog
            isOpen={dialog.isOpen}
            onOpenChange={dialog.setOpen}
            title="Cancel this booking?"
            footer={
              <>
                <Button variant="secondary" slot="close">
                  Keep booking
                </Button>
                <Button variant="danger" slot="close" onPress={() => toast.danger("Booking cancelled")}>
                  Cancel booking
                </Button>
              </>
            }
          >
            <p className="text-sm text-subtle">
              Your Royal Enfield Classic 350 on 20 – 22 Oct will be released. This cannot be undone.
            </p>
          </ModalDialog>
        </Demo>

        <Demo title="Toasts">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onPress={() => toast.success("Booking confirmed", { description: "Pickup on 20 Oct, 10:00 AM." })}>
              Success
            </Button>
            <Button variant="secondary" onPress={() => toast.danger("Payment failed", { description: "Try another method." })}>
              Error
            </Button>
            <Button variant="secondary" onPress={() => toast.info("2 bikes left at this location")}>
              Info
            </Button>
          </div>
        </Demo>
      </div>
    </Section>
  );
}
