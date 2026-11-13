interface Props {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  inputMode?: 'decimal' | 'numeric' | 'text'
  type?: 'text' | 'date'
  placeholder?: string
}

export function Field({ id, label, value, onChange, error, inputMode = 'text', type = 'text', placeholder }: Props) {
  const errId = `${id}-err`
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        className="inp"
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errId : undefined}
      />
      {error && (
        <span id={errId} className="err">
          {error}
        </span>
      )}
    </div>
  )
}
