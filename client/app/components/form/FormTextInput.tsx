const FormTextInput = ({ name, value, setValue }: { name: string; value: string; setValue: any }) => {
  return (
    <div className="mb-3">
      <label htmlFor={name.replace(' ', '_')} className="form-label">
        {name}
      </label>
      <input
        type="text"
        id={name.replace(' ', '_')}
        value={value}
        onChange={(e: any) => setValue(e.target.value)}
        className="form-control"
      />
    </div>
  );
};

export default FormTextInput;
