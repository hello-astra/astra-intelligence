import type { Ref } from 'react'
import { ddmmyyyy, docTotals, money, type SampleDocument } from '@/data/mock/ocr'

/** Renders a sample document as paper. `data-region` attributes mark the fields the extractor reads. */
export function DocumentPaper({ doc, paperRef }: { doc: SampleDocument; paperRef?: Ref<HTMLDivElement> }) {
  const { subtotal, total } = docTotals(doc)
  if (doc.template === 'receipt') {
    return (
      <div ref={paperRef} className="paper relative mx-auto w-full max-w-[320px] rotate-[-0.6deg] rounded-sm px-6 py-7 font-mono text-[11.5px] leading-[1.55]">
        <div data-region="merchant" className="text-center">
          <p className="text-[14px] font-bold tracking-wide">{doc.merchant.name}</p>
          {doc.merchant.lines.map((l) => (
            <p key={l} className="text-[10.5px] text-[#555]">
              {l}
            </p>
          ))}
        </div>
        {doc.merchant.gstin && (
          <p data-region="gstin" className="mt-1 text-center text-[10.5px] text-[#555]">
            GSTIN: {doc.merchant.gstin}
          </p>
        )}
        <div className="my-3 border-t border-dashed border-[#999]" />
        <div className="flex justify-between">
          <span data-region="docNumber">
            {doc.docLabel}: {doc.docNumber}
          </span>
        </div>
        <div className="flex justify-between">
          <span data-region="date">Date: {ddmmyyyy(doc.date)}</span>
          <span className="text-[#555]">{String(9 + (doc.docNumber.length % 9)).padStart(2, '0')}:4{doc.items.length} </span>
        </div>
        <div className="my-3 border-t border-dashed border-[#999]" />
        <div data-region="items" className="space-y-0.5">
          {doc.items.map((i) => (
            <div key={i.description}>
              <p>{i.description}</p>
              <p className="flex justify-between text-[#444]">
                <span>
                  {i.qty} x {money(i.unitPrice)}
                </span>
                <span>{money(i.qty * i.unitPrice)}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="my-3 border-t border-dashed border-[#999]" />
        <p data-region="subtotal" className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </p>
        {doc.taxes.length > 0 && (
          <div data-region="tax">
            {doc.taxes.map((t) => (
              <p key={t.label} className="flex justify-between">
                <span>{t.label}</span>
                <span>{money(t.amount)}</span>
              </p>
            ))}
          </div>
        )}
        {doc.roundOff ? (
          <p className="flex justify-between text-[#555]">
            <span>Round off</span>
            <span>{money(doc.roundOff)}</span>
          </p>
        ) : null}
        <p data-region="total" className="mt-1 flex justify-between text-[14px] font-bold">
          <span>TOTAL ₹</span>
          <span>{money(total)}</span>
        </p>
        {doc.payment && (
          <p data-region="payment" className="mt-2 text-[#444]">
            Paid via {doc.payment}
          </p>
        )}
        <div className="my-3 border-t border-dashed border-[#999]" />
        <p className="text-center text-[10.5px] text-[#555]">{doc.footer}</p>
      </div>
    )
  }

  return (
    <div ref={paperRef} className="paper relative mx-auto w-full max-w-[460px] rotate-[0.4deg] rounded-sm p-7 font-sans text-[11px] leading-snug">
      <div className="flex items-start justify-between gap-4">
        <div data-region="merchant" className="max-w-[60%]">
          <p className="text-[15px] font-bold text-[#1d2433]">{doc.merchant.name}</p>
          {doc.merchant.lines.map((l) => (
            <p key={l} className="text-[#5b6170]">
              {l}
            </p>
          ))}
          {doc.merchant.gstin && (
            <p data-region="gstin" className="mt-0.5 text-[#5b6170]">
              GSTIN {doc.merchant.gstin}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-[13px] font-bold tracking-[0.12em] text-[#2b5fd9]">{doc.kind === 'Utility bill' ? 'ELECTRICITY BILL' : 'TAX INVOICE'}</p>
          <p data-region="docNumber" className="mt-2 text-[#1d2433]">
            {doc.docLabel}: <span className="font-semibold">{doc.docNumber}</span>
          </p>
          <p data-region="date" className="text-[#1d2433]">
            Date: {ddmmyyyy(doc.date)}
          </p>
          {doc.dueDate && (
            <p data-region="dueDate" className="text-[#1d2433]">
              Due: {ddmmyyyy(doc.dueDate)}
            </p>
          )}
        </div>
      </div>
      {doc.billTo && (
        <div data-region="billTo" className="mt-5 rounded-sm bg-[#f1efe9] px-3 py-2">
          <p className="text-[9.5px] font-semibold tracking-wider text-[#6b7180] uppercase">Bill to</p>
          <p className="font-semibold text-[#1d2433]">{doc.billTo.name}</p>
          {doc.billTo.lines.map((l) => (
            <p key={l} className="text-[#5b6170]">
              {l}
            </p>
          ))}
          {doc.billTo.gstin && <p className="text-[#5b6170]">GSTIN {doc.billTo.gstin}</p>}
        </div>
      )}
      <table data-region="items" className="mt-5 w-full text-left">
        <thead>
          <tr className="border-b border-[#cfcac0] text-[9.5px] tracking-wider text-[#6b7180] uppercase">
            <th className="py-1.5 font-semibold">Description</th>
            <th className="py-1.5 text-right font-semibold">Qty</th>
            <th className="py-1.5 text-right font-semibold">Rate</th>
            <th className="py-1.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.items.map((i) => (
            <tr key={i.description} className="border-b border-[#e6e2d9] text-[#1d2433]">
              <td className="py-1.5 pr-2">{i.description}</td>
              <td className="py-1.5 text-right">{i.qty}</td>
              <td className="py-1.5 text-right">{money(i.unitPrice)}</td>
              <td className="py-1.5 text-right">{money(i.qty * i.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-3 ml-auto w-[55%] space-y-0.5 text-[#1d2433]">
        <p data-region="subtotal" className="flex justify-between">
          <span>Subtotal</span>
          <span>₹{money(subtotal)}</span>
        </p>
        <div data-region="tax">
          {doc.taxes.map((t) => (
            <p key={t.label} className="flex justify-between">
              <span>{t.label}</span>
              <span>₹{money(t.amount)}</span>
            </p>
          ))}
        </div>
        <p data-region="total" className="mt-1 flex justify-between border-t border-[#1d2433] pt-1 text-[13px] font-bold">
          <span>Total</span>
          <span>₹{money(total)}</span>
        </p>
      </div>
      {doc.payment && (
        <p data-region="payment" className="mt-4 text-[#5b6170]">
          Payment: {doc.payment}
        </p>
      )}
      <p className="mt-5 border-t border-[#e6e2d9] pt-2 text-center text-[9.5px] text-[#8a8f9c]">{doc.footer}</p>
    </div>
  )
}
