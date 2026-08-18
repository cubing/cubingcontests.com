"use client";

type Props = {
  children: React.ReactNode;
  ref: React.RefObject<HTMLDialogElement | null>;
  title: string;
  // onSubmit: () => void;
};

function Modal({ children, ref, title }: Props) {
  return (
    <dialog ref={ref} className="m-auto border border-2">
      <div className="modal-dialog" style={{ maxWidth: "var(--rr-md-width)" }}>
        <div className="modal-content">
          <div className="modal-header my-3 px-3">
            <h5 className="modal-title">{title}</h5>
            <button type="button" onClick={() => ref.current!.close()} className="btn-close" aria-label="Close" />
          </div>
          <div className="modal-body">{children}</div>
          {/* <div className="modal-footer gap-2">
            <button type="button" onClick={() => ref.current!.close()} className="btn btn-secondary">
              Cancel
            </button>
            <button type="button" onClick={() => onSubmit()} className="btn btn-primary">
              Submit
            </button>
          </div> */}
        </div>
      </div>
    </dialog>
  );
}

export default Modal;
