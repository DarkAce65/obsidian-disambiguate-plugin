import { JSX, ParentProps } from 'solid-js';

function FormControl(
  props: ParentProps<{ label: string; error?: boolean; message?: string }>,
): JSX.Element {
  return (
    <label style={{ display: 'flex', gap: '12px' }}>
      <span style={{ 'flex-basis': '100px', 'line-height': 'var(--input-height)' }}>
        {props.label}
      </span>
      <div style={{ 'flex-grow': 1 }}>
        {props.children}
        {props.message && (
          <div style={{ 'margin-top': 'var(--size-2-2)' }}>
            <small style={{ color: props.error ? 'var(--text-error)' : undefined }}>
              {props.message}
            </small>
          </div>
        )}
      </div>
    </label>
  );
}

export default FormControl;
