"use client";

import FormInputLabel from "~/app/components/form/FormInputLabel.tsx";

type Props = {
  id?: string;
  title?: string;
  value: string;
  setValue: (val: string) => void;
  rows?: number;
  disabled?: boolean;
};

function FormTextArea({ id, title, value, setValue, rows = 10, disabled = false }: Props) {
  if (!id && !title) throw new Error("Neither title nor id are set in FormTextArea");

  const inputId = (id || title) as string;

  return (
    <div className="mb-3">
      {title && <FormInputLabel text={title} inputId={inputId} />}

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
