import { useCallback, useMemo, useRef, useState } from 'react'
import { FlaskConical, GitCompareArrows, Radar, Sigma, Table2 } from 'lucide-react'
import { useToast } from '@/components/ui/toast-context'
import { SOLUTION_BY_SLUG } from '@/data/constants/solutions'
import { getForecastDatasets } from '@/data/mock/predictive'
import { usePersistentState } from '@/hooks/usePersistentState'
import { DemoShell } from '../shared/DemoShell'
import type { DemoView } from '../shared/demo-context'
import { MODEL_SHORT, NEUTRAL_SCENARIO, runForecast, type ForecastConfig } from './models'
import { valueFormatter, type PredictiveCtx, type PredictiveView } from './shared'
import { AnomaliesView } from './views/AnomaliesView'
import { DataView } from './views/DataView'
import { ForecastView } from './views/ForecastView'
import { ModelsView } from './views/ModelsView'
import { ScenarioView } from './views/ScenarioView'

const solution = SOLUTION_BY_SLUG['predictive-analytics']
const initConfig = (): ForecastConfig => ({ datasetId: 'retail', horizon: 6, model: 'auto', confidence: 80, scenario: { ...NEUTRAL_SCENARIO }, sensitivity: 3.5 })

type Core = Pick<ForecastConfig, 'datasetId' | 'horizon' | 'model' | 'confidence'>
const coreOf = (c: ForecastConfig): Core => ({ datasetId: c.datasetId, horizon: c.horizon, model: c.model, confidence: c.confidence })
const sameCore = (a: Core, b: Core) => a.datasetId === b.datasetId && a.horizon === b.horizon && a.model === b.model && a.confidence === b.confidence

const VIEWS: DemoView<PredictiveView>[] = [
  { id: 'forecast', label: 'Forecast', icon: Sigma },
  { id: 'scenarios', label: 'Scenario planning', icon: FlaskConical },
  { id: 'anomalies', label: 'Anomalies', icon: Radar },
  { id: 'models', label: 'Model comparison', icon: GitCompareArrows },
  { id: 'data', label: 'Data & export', icon: Table2 },
]

export default function PredictiveDemo() {
  const toast = useToast()
  const datasets = useMemo(() => getForecastDatasets(), [])
  const [config, setConfigState, reset] = usePersistentState('predictive', initConfig, 1)
  const [view, setView] = useState<PredictiveView>('forecast')
  const [generated, setGenerated] = useState<Core>(() => coreOf(config))
  const [running, setRunning] = useState(false)
  const [stage, setStage] = useState<string | null>(null)
  const timers = useRef<number[]>([])

  const ds = datasets.find((d) => d.id === generated.datasetId) ?? datasets[0]
  const format = useMemo(() => valueFormatter(ds), [ds])
  // Scenario and sensitivity are post-processing on top of the fitted model, so they apply live.
  const result = useMemo(
    () => runForecast(ds, { ...generated, scenario: config.scenario, sensitivity: config.sensitivity }, format),
    [ds, generated, config.scenario, config.sensitivity, format],
  )

  const setConfig = useCallback(
    (patch: Partial<ForecastConfig>) =>
      setConfigState((c) => {
        const next = { ...c, ...patch }
        if (patch.datasetId && patch.datasetId !== c.datasetId) {
          const d = datasets.find((x) => x.id === patch.datasetId)
          if (d && !d.horizons.includes(next.horizon)) next.horizon = d.defaultHorizon
        }
        return next
      }),
    [setConfigState, datasets],
  )

  const generate = (override?: Partial<ForecastConfig>) => {
    if (running) return
    const target = coreOf({ ...config, ...override })
    if (override) setConfig(override)
    timers.current.forEach((t) => window.clearTimeout(t))
    setRunning(true)
    const steps = ['Fitting models to history…', 'Backtesting on hold-out data…', 'Computing prediction intervals…', 'Detecting anomalies…']
    steps.forEach((s, i) => timers.current.push(window.setTimeout(() => setStage(s), i * 320)))
    timers.current.push(
      window.setTimeout(() => {
        setGenerated(target)
        setRunning(false)
        setStage(null)
        const d = datasets.find((x) => x.id === target.datasetId)
        toast({
          title: 'Forecast generated',
          description: `${d?.name ?? 'Dataset'} · ${target.horizon} ${d?.frequency ?? 'period'}s ahead · ${target.model === 'auto' ? 'best model by backtest' : MODEL_SHORT[target.model]}`,
        })
      }, steps.length * 320 + 200),
    )
  }

  const ctx: PredictiveCtx = {
    config,
    setConfig,
    result,
    datasets,
    generate,
    running,
    stage,
    stale: !sameCore(coreOf(config), generated),
    format,
  }

  return (
    <DemoShell
      solution={solution}
      views={VIEWS}
      activeView={view}
      onViewChange={setView}
      onReset={() => {
        reset()
        setGenerated(coreOf(initConfig()))
        setView('forecast')
      }}
    >
      {view === 'forecast' && <ForecastView {...ctx} />}
      {view === 'scenarios' && <ScenarioView {...ctx} />}
      {view === 'anomalies' && <AnomaliesView {...ctx} />}
      {view === 'models' && <ModelsView {...ctx} />}
      {view === 'data' && <DataView {...ctx} />}
    </DemoShell>
  )
}
