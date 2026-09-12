import { type SyntheticEvent, useId, useState } from 'react';
import { parseStockInput } from '../../lib/validateStock';

type StockCorrectionFormProps = {
  currentStock: number;
  isSaving: boolean;
  saveError: string | null;
  onSave: (stock: number) => void;
  onRetry: () => void;
};

export function StockCorrectionForm({
  currentStock,
  isSaving,
  saveError,
  onSave,
  onRetry,
}: StockCorrectionFormProps) {
  const errorId = useId();
  const [value, setValue] = useState(String(currentStock));
  const [localError, setLocalError] = useState<string | null>(null);
  const parsed = parseStockInput(value);
  const error = localError ?? saveError;
  const describedBy = error ? errorId : undefined;

  function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = parseStockInput(value);
    if (!next.ok) {
      setLocalError(next.message);
      return;
    }
    setLocalError(null);
    onSave(next.stock);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4"
    >
      <h2 className="text-lg font-semibold">Stock correction</h2>
      <p className="mt-1 text-sm text-slate-600">
        Current count is {currentStock}. Enter the count you can see on the
        shelf.
      </p>
      <div className="mt-4">
        <label htmlFor="stock-count" className="mb-1 block text-sm font-medium">
          New stock count
        </label>
        <input
          id="stock-count"
          inputMode="numeric"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          disabled={isSaving}
          onChange={(event) => {
            setValue(event.target.value);
            setLocalError(null);
          }}
          className="min-h-11 w-full max-w-xs rounded-md border border-slate-300 px-3 text-base"
        />
        {error ? (
          <p id={errorId} className="mt-2 text-sm text-stock-out" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={isSaving || !parsed.ok}
          className="min-h-11 rounded-md bg-brand px-4 text-base text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        {saveError ? (
          <button
            type="button"
            onClick={onRetry}
            disabled={isSaving}
            className="min-h-11 rounded-md border border-slate-300 px-4 text-base"
          >
            Retry
          </button>
        ) : null}
      </div>
    </form>
  );
}
