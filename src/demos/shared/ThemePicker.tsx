import { Palette } from 'lucide-react'
import { Dropdown } from '@/components/ui/Dropdown'
import type { DemoThemePreset } from '@/theme/demo-presets'
import { useDemoTheme } from './demo-theme'

function Swatch({ preset }: { preset: DemoThemePreset }) {
  return (
    <span className="relative flex size-7 shrink-0 items-center justify-center rounded-lg ring-1 ring-ink/10" aria-hidden>
      <span className="absolute inset-y-1.5 left-1.5 w-2.5 rounded-l-full" style={{ backgroundColor: preset.primary }} />
      <span className="absolute inset-y-1.5 right-1.5 w-2.5 rounded-r-full" style={{ backgroundColor: preset.secondary }} />
    </span>
  )
}

/** Template switcher for the current demo. The choice is remembered per product. */
export function ThemePicker() {
  const ctx = useDemoTheme()
  if (!ctx) return null
  const { presets, preset, setPreset } = ctx
  return (
    <Dropdown
      ariaLabel={`Theme: ${preset.name}. Change theme`}
      align="end"
      menuClassName="w-72"
      buttonClassName="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[13px] font-medium text-fg-2 ring-1 ring-ink/10 ring-inset transition-colors hover:bg-ink/[0.06] hover:text-fg"
      buttonContent={
        <>
          <Palette className="size-3.5 text-brand-soft" aria-hidden />
          <span className="hidden xl:inline">{preset.name}</span>
        </>
      }
      header={<p className="text-[11px] font-semibold tracking-wide text-fg-3 uppercase">Product theme</p>}
      items={presets.map((p, i) => ({
        id: p.id,
        label: i === 0 ? `${p.name} · default` : p.name,
        description: p.description,
        icon: <Swatch preset={p} />,
        active: p.id === preset.id,
        onSelect: () => setPreset(p.id),
      }))}
      footer={<p className="px-2 py-1.5 text-[11px] leading-relaxed text-fg-4">Each theme has a light and dark version — use the sun/moon switch.</p>}
    />
  )
}
