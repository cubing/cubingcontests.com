type Props = {
  disabled: boolean;
  checked?: boolean;
  setChecked?: (checked: boolean) => void;
} & React.HTMLAttributes<HTMLFieldSetElement>;

function CommunicationsCheckbox({ disabled, checked, setChecked, className }: Props) {
  return (
    <fieldset className={`form-check ${className}`}>
      <input
        id="communications_agreed"
        type="checkbox"
        name="communicationsAgreed"
        checked={checked}
        onChange={setChecked ? (e) => setChecked(e.target.checked) : undefined}
        disabled={disabled}
        className="form-check-input"
      />
      <label htmlFor="communications_agreed" className="form-check-label ms-1">
        I agree to receiving communications from {process.env.NEXT_PUBLIC_PROJECT_NAME} about news and feature updates (
        <strong>you can unsubscribe at any time</strong>)
      </label>
    </fieldset>
  );
}

export default CommunicationsCheckbox;
