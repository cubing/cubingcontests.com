"use client";

import FormInputLabel from "~/app/components/form/FormInputLabel.tsx";

type Props = {
  id?: string;
  title?: string;
  value: string;
  setValue: (val: string) => void;
  rows?: number;
  disabled?: boolean;
  optional?: boolean;
} & React.HTMLAttributes<HTMLDivElement>;

function FormTextArea({ id, title, value, setValue, rows = 5, disabled = false, optional = false, className }: Props) {
  if (!id && !title) throw new Error("Neither title nor id are set in FormTextArea");

  const inputId = (id || title) as string;

  return (
    <div className={className}>
      {title && <FormInputLabel text={title} inputId={inputId} optional={optional} />}

      <textarea
        id={inputId}
        rows={rows}
        value={value}
        onChange={(e: any) => setValue(e.target.value)}
        className="form-control"
        disabled={disabled}
      />
    </div>
  );
}

export default FormTextArea;
