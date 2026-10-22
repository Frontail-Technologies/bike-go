"use client";

import { ArrowRightIcon, HeartIcon, PlusIcon, ShareNetworkIcon, TrashIcon } from "@phosphor-icons/react";
import { Spinner } from "@heroui/react";
import { useState } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Demo, Section } from "../section";

export function ButtonsSection() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaving(true);
    window.setTimeout(() => setSaving(false), 1600);
  }

  return (
    <Section id="buttons" title="Buttons" description="48px by default, 44px minimum. Press feedback is HeroUI's native CSS transform.">
      <div className="grid gap-8 md:grid-cols-2">
        <Demo title="Variants">
          <div className="flex flex-wrap gap-3">
            <Button>Get started</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Sign in</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Cancel booking</Button>
          </div>
        </Demo>

        <Demo title="Sizes and icons">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button>Medium</Button>
            <Button size="lg">
              Large
              <ArrowRightIcon size={20} />
            </Button>
            <Button variant="secondary">
              <PlusIcon size={20} />
              Add on
            </Button>
          </div>
        </Demo>

        <Demo title="Loading and disabled">
          <div className="flex flex-wrap gap-3">
            <Button isPending={saving} onPress={save}>
              {({ isPending }) => (
                <>
                  {isPending ? <Spinner color="current" size="sm" /> : null}
                  {isPending ? "Saving" : "Save changes"}
                </>
              )}
            </Button>
            <Button isDisabled>Unavailable</Button>
          </div>
        </Demo>

        <Demo title="Icon buttons (44px, labelled)">
          <div className="flex flex-wrap items-center gap-3">
            <IconButton
              label={saved ? "Remove from saved" : "Save bike"}
              aria-pressed={saved}
              variant="secondary"
              onPress={() => setSaved((v) => !v)}
              icon={<HeartIcon size={20} weight={saved ? "fill" : "regular"} className={saved ? "text-danger" : undefined} />}
            />
            <IconButton label="Share" variant="secondary" icon={<ShareNetworkIcon size={20} />} />
            <IconButton label="Delete" variant="danger" icon={<TrashIcon size={20} />} />
          </div>
        </Demo>
      </div>

      <Demo title="Full width">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-3">
          <Button fullWidth size="lg">
            Get started
            <ArrowRightIcon size={20} />
          </Button>
          <Button fullWidth variant="outline" size="lg">
            Sign in
          </Button>
        </div>
      </Demo>
    </Section>
  );
}
