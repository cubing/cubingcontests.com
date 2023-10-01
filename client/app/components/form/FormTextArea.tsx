'use client';

const FormTextArea = ({
  id,
  title,
  value,
  onChange,
  rows = 10,
  disabled = false,
}: {
  id?: string;
  title?: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
  disabled?: boolean;
}) => {
  if (!id && !title) throw new Error('Neither title nor id are set in FormTextArea');

  const inputId = id || title;

  return (
    <div className="mb-3">
      {title && (
        <label htmlFor={inputId} className="form-label">
          {title}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        value={value}
        onChange={(e: any) => onChange(e.target.value)}
        className="form-control"
        disabled={disabled}
      />
    </div>
  );
};

export default FormTextArea;
